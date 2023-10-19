import {
  Agent,
  AgentFunctionResult,
  AgentOutputType,
  AgentVariables,
  ChatLogs,
  ChatMessageBuilder,
  LlmApi,
  Tokenizer,
  trimText,
} from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../AgentFunctionBase";
import { FUNCTION_CALL_FAILED, FUNCTION_CALL_SUCCESS_CONTENT } from "../agents/Scripter/utils";
import { AgentBaseContext } from "../AgentBase";

interface CodeFuncParameters {
  query: string;
}

export class CodeFunction extends AgentFunctionBase<CodeFuncParameters> {
  constructor(private _llm: LlmApi, private _tokenizer: Tokenizer) {
    super();
  }

  name: string = "code";
  description: string = `Writes code for a given query.`;
  parameters: any = {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Query to code for",
      },
    },
    required: [
      "query"
    ],
    additionalProperties: false,
  };

  buildExecutor(
    _: Agent<unknown>,
    context: AgentBaseContext
  ): (
    params: CodeFuncParameters,
    rawParams?: string
  ) => Promise<AgentFunctionResult> {
    return async (
      params: CodeFuncParameters,
      rawParams?: string
    ): Promise<AgentFunctionResult> => {
      try {
        const files = context.workspace.readdirSync("/");
        const textFileContents = files.map((f) => `

        File: ${f.name}
        Content: ${context.workspace.readFileSync(f.name)}
        
        `)

        const chatLogs = ChatLogs.from([{
          role: "user",
          content: this.getCodePrompt(
            params.query,
            textFileContents.join("\n"),
          )
        }], [], this._tokenizer);

        const response = await this._llm.getResponse(chatLogs)

        if (!response || !response.content) {
          throw new Error("Failed to plan development: No response from LLM");
        }

        console.log(response.content)
  
        return this.onSuccess(
          params,
          response.content,
          rawParams,
          context.variables
        );
      } catch (err) {
        return this.onError(
          params,
          err.toString(),
          rawParams,
          context.variables
        );
      }
    };
  }

  private onSuccess(
    params: CodeFuncParameters,
    result: string,
    rawParams: string | undefined,
    variables: AgentVariables
  ): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `Code '${params.query}'`,
          content: FUNCTION_CALL_SUCCESS_CONTENT(
            this.name,
            params,
            `Code:` +
              `\n--------------\n` +
              `${result}\n` +
              `\n--------------\n`
          ),
        },
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ...ChatMessageBuilder.functionCallResultWithVariables(
          this.name,
          `Code:` +
          `\n--------------\n` +
          `${result}\n` +
          `\n--------------\n`,
          variables
        ),
      ],
    };
  }

  private onError(
    params: CodeFuncParameters,
    error: string,
    rawParams: string | undefined,
    variables: AgentVariables
  ) {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `Code`,
          content: FUNCTION_CALL_FAILED(
            params,
            this.name,
            error
          ),
        },
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ...ChatMessageBuilder.functionCallResultWithVariables(
          this.name,
          `Error coding\n` + 
          `\`\`\`\n` +
          `${trimText(error, 300)}\n` +
          `\`\`\``,
          variables
        ),
      ],
    };
  }

  private getCodePrompt(query: string, files: string): string {
    return `You are a senior Python developer tasked to write python code, upon receiving
    a query and the contents of all relevant files on your workspace.

    You will return the necessary python code to achieve the given query.
    
    Files: ${files}
    -------------------------------
    Query: ${query}`;
  }
}

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

interface AnalyzeCodeFuncParameters {
  query: string;
}

export class AnalyzeCodeFunction extends AgentFunctionBase<AnalyzeCodeFuncParameters> {
  constructor(private _llm: LlmApi, private _tokenizer: Tokenizer) {
    super();
  }

  name: string = "analyze_code";
  description: string = `Analyzes the code across files for a given query.`;
  parameters: any = {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Query to analyze the code for",
      },
    },
    required: ["query"],
    additionalProperties: false,
  };

  buildExecutor(
    _: Agent<unknown>,
    context: AgentBaseContext
  ): (
    params: AnalyzeCodeFuncParameters,
    rawParams?: string
  ) => Promise<AgentFunctionResult> {
    return async (
      params: AnalyzeCodeFuncParameters,
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
          content: this.getAnalysisPrompt(params.query, textFileContents.join("\n"))
        }], [], this._tokenizer);

        const response = await this._llm.getResponse(chatLogs)

        if (!response || !response.content) {
          throw new Error("Failed to Analysis: No response from LLM");
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
    params: AnalyzeCodeFuncParameters,
    result: string,
    rawParams: string | undefined,
    variables: AgentVariables
  ): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `Analysis for '${params.query}'`,
          content: FUNCTION_CALL_SUCCESS_CONTENT(
            this.name,
            params,
            `Analysis:` +
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
          `Analysis:` +
          `\n--------------\n` +
          `${result}\n` +
          `\n--------------\n`,
          variables
        ),
      ],
    };
  }

  private onError(
    params: AnalyzeCodeFuncParameters,
    error: string,
    rawParams: string | undefined,
    variables: AgentVariables
  ) {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `Analysis`,
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
          `Error analyzing code\n` + 
          `\`\`\`\n` +
          `${trimText(error, 300)}\n` +
          `\`\`\``,
          variables
        ),
      ],
    };
  }

  private getAnalysisPrompt(query: string, files: string): string {
    return `You are an expert python code analyzer. You will given a query and a list of files.
    Some files will be python source files, others are just text files for context. You will consider
    the context of the text files; but only analyze the code in the python source files.
    You must ensure that the code in the files fully satisfy the query.
    If the code does not satisfy the query, you will tell the user exactly what's missing and why
    
    Do NOT invent requirements that don't exist or come up with improvements unless needed.
    
    Query: ${query}
    -------------------------------
    Files: ${files}`;
  }
}

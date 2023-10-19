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

interface AnalyzeWorkspaceFuncParameters {
  query: string;
}

export class AnalyzeWorkspaceFunction extends AgentFunctionBase<AnalyzeWorkspaceFuncParameters> {
  constructor(private _llm: LlmApi, private _tokenizer: Tokenizer) {
    super();
  }

  name: string = "analyze_workspace";
  description: string = `Analyzes the workspace for a given query.`;
  parameters: any = {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Query to analyze the workspace for",
      },
    },
    required: ["query"],
    additionalProperties: false,
  };

  buildExecutor(
    _: Agent<unknown>,
    context: AgentBaseContext
  ): (
    params: AnalyzeWorkspaceFuncParameters,
    rawParams?: string
  ) => Promise<AgentFunctionResult> {
    return async (
      params: AnalyzeWorkspaceFuncParameters,
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
    params: AnalyzeWorkspaceFuncParameters,
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
    params: AnalyzeWorkspaceFuncParameters,
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
          `Error analyzing workspace\n` + 
          `\`\`\`\n` +
          `${trimText(error, 300)}\n` +
          `\`\`\``,
          variables
        ),
      ],
    };
  }

  private getAnalysisPrompt(query: string, files: string): string {
    return `You are an expert files analyzer. You will given a query and a list of files.
    You must analyze the files and provide a response to the query.
    
    Query: ${query}
    -------------------------------
    Files: ${files}`;
  }
}

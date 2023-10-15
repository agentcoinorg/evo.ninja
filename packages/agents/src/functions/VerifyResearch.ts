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

interface VerifyResearchFuncParameters {
  originalQuery: string;
  context: string;
  foundData: string;
}

export class VerifyResearchFunction extends AgentFunctionBase<VerifyResearchFuncParameters> {
  constructor(private _llm: LlmApi, private _tokenizer: Tokenizer) {
    super();
  }

  get name(): string {
    return "verify_research";
  }
  get description(): string {
    return `Verify research for a given query.`;
  }
  get parameters() {
    return {
      type: "object",
      properties: {
        originalQuery: {
          type: "string",
          description: "Original query for the research",
        },
        context: {
          type: "string",
          description: "Context about the research",
        },
        foundData: {
          type: "string",
          description: "Data results for the research query",
        },
      },
      required: ["originalQuery", "context", "foundData"],
      additionalProperties: false,
    };
  }

  buildExecutor(
    _: Agent<unknown>,
    context: AgentBaseContext
  ): (
    params: VerifyResearchFuncParameters,
    rawParams?: string
  ) => Promise<AgentFunctionResult> {
    return async (
      params: VerifyResearchFuncParameters,
      rawParams?: string
    ): Promise<AgentFunctionResult> => {
      try {
        const prompt = this.getPlanningPrompt({
          query: params.originalQuery,
          context: params.context,
          foundData: params.foundData,
        });
        const chatLogs = new ChatLogs({
          "persistent": {
            tokens: this._tokenizer.encode(prompt).length,
            msgs: [{
              role: "user",
              content: prompt
            }]
          },
          "temporary": {
            tokens: 0,
            msgs: []
          }
        });

        const response = await this._llm.getResponse(chatLogs, undefined)

        if (!response || !response.content) {
          throw new Error("Failed to verify research: No response from LLM");
        }
  
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
    params: VerifyResearchFuncParameters,
    result: string,
    rawParams: string | undefined,
    variables: AgentVariables
  ): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `Verify research for '${params.originalQuery}'`,
          content: FUNCTION_CALL_SUCCESS_CONTENT(
            this.name,
            params,
            `Verification:` +
              `\n--------------\n` +
              `${result}\n` +
              `\n--------------\n`
          ),
        },
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ChatMessageBuilder.functionCallResult(
          this.name,
          `Verification: ` +
            `${result}\n` +
            `\`\`\``,
          variables
        ),
      ],
    };
  }

  private onError(
    params: VerifyResearchFuncParameters,
    error: string,
    rawParams: string | undefined,
    variables: AgentVariables
  ) {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `Verify research for '${params.originalQuery}'`,
          content: FUNCTION_CALL_FAILED(
            params,
            this.name,
            error
          ),
        },
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ChatMessageBuilder.functionCallResult(
          this.name,
          `Error verifying research for '${params.originalQuery}'\n` + 
          `\`\`\`\n` +
          `${trimText(error, 300)}\n` +
          `\`\`\``,
          variables
        ),
      ],
    };
  }

  private getPlanningPrompt({
    query,
    context,
    foundData,
  }: {
    query: string;
    context: string;
    foundData: string;
  }): string {
    return `You are a Research Results Verifier agent tasked with verifying the results of a research query and making sure they fully satisfy the query.
    
    1. You will check the query and make sure that the results are sufficient and complete for the query, considering the context.
      If a part of the data is missing, you will consider the result incomplete and communicate what's missing exactly.

    2. Be very critical, don't assume that the user is correct if he says that the results are correct or complete, or fully provided.
    
    Here's what you need to analyze:
    
    - Query: ${query}
    - Context: ${context}
    - Results: ${foundData}`;
  }
}

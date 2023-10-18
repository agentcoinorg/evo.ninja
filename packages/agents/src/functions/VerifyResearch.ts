import {
  Agent,
  AgentFunctionResult,
  AgentOutputType,
  AgentVariables,
  ChatMessageBuilder,
  LlmApi,
  Tokenizer,
  trimText,
} from "@evo-ninja/agent-utils";
import { FUNCTION_CALL_FAILED, FUNCTION_CALL_SUCCESS_CONTENT } from "../agents/Scripter/utils";
import { AgentBaseContext } from "../AgentBase";
import { LlmAgentFunctionBase } from "../LlmAgentFunctionBase";

interface VerifyResearchFuncParameters {
  originalQuery: string;
  context: string;
  foundData: string;
}

export class VerifyResearchFunction extends LlmAgentFunctionBase<VerifyResearchFuncParameters> {
  constructor(llm: LlmApi, tokenizer: Tokenizer) {
    super(llm, tokenizer);
  }

  name: string = "verify_research";
  description: string = `Verify research for a given query.`;
  parameters: any = {
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
        const prompt = this.getVerificationPrompt({
          query: params.originalQuery,
          context: params.context,
          foundData: params.foundData,
        });

        const response = await this.askLlm(prompt);
  
        return this.onSuccess(
          params,
          response,
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
        ...ChatMessageBuilder.functionCallResultWithVariables(
          this.name,
          `Verification: \n` +
          `\`\`\`\n` +
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
        ...ChatMessageBuilder.functionCallResultWithVariables(
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

  private getVerificationPrompt({
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
      If a part of the data is missing (strictly relative to the original query), you will consider the result incomplete and communicate what's missing exactly.

    2. Don't assume that the user is correct if he says that the results are correct or complete, or that the rest of the data is unavailable, or fully provided.
    
    Here's what you need to analyze:
    
    - Query: ${query}
    - Context: ${context}
    - Results: ${foundData}`;
  }
}

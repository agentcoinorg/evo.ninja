import { AgentOutputType, ChatMessageBuilder, AgentOutput, AgentFunctionResult, ChatMessage, LlmApi, Tokenizer } from "@evo-ninja/agent-utils"
import { Agent } from "../agents/utils";
import { LlmAgentFunctionBase } from "./utils";
import { GoalVerifierAgent } from "../agents";

interface FunctionParams {
}

export class VerifyGoalAchievedFunction extends LlmAgentFunctionBase<FunctionParams> {
  constructor(llm: LlmApi, tokenizer: Tokenizer) {
    super(llm, tokenizer);
  }

  name: string = "verifyGoalAchieved";
  description: string = `Verifies that the goal has been achieved.`;
  parameters: any = {
    type: "object",
    properties: {
    },
    required: [],
    additionalProperties: false
  };

  onSuccess(name: string, rawParams: string | undefined, messages: string[], result: AgentOutput): AgentFunctionResult {
    return {
      outputs: [
        result
      ],
      messages: [
        ChatMessageBuilder.functionCall(name, rawParams),
        ...messages.map(x => ({
          role: "assistant",
          content: x,
        }) as ChatMessage),
        ChatMessageBuilder.functionCallResult(
          name,
          result.content || "Successfully accomplished the task."
        )
      ]
    }
  }

  onFailure(name: string, params: any, rawParams: string | undefined, error: string | undefined): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `"${name}" failed to accomplish the task "${params.task}"`,
          content: `Error: ${error}`
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(name, rawParams),
        ChatMessageBuilder.functionCallResult(
          name,
          `Error: ${error}`
        )
      ]
    }
  }

  buildExecutor({ context }: Agent<unknown>) {
    return async (params: FunctionParams, rawParams?: string): Promise<AgentFunctionResult> => {
      const result = await this.askAgent(
        new GoalVerifierAgent(context.cloneEmpty()), 
        { messagesToVerify: context.chat.messages },
        context,
      );

      if (!result.ok) {
        return this.onFailure(
          this.name,
          params,
          rawParams,
          result.error
        );
      } else {
        return this.onSuccess(
          this.name,
          rawParams,
          [],
          result.value.output
        );
      }
    }
  }
}

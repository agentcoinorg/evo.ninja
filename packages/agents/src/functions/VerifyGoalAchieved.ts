import { AgentOutputType, ChatMessageBuilder, AgentOutput, AgentFunctionResult, ChatMessage, AgentVariables, LlmApi, Tokenizer } from "@evo-ninja/agent-utils"
import { GoalVerifierAgent } from "../scriptedAgents";
import { AgentContext } from "../AgentContext";
import { LlmAgentFunctionBase } from "../LlmAgentFunctionBase";
import { Agent } from "../Agent";

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

  onSuccess(name: string, rawParams: string | undefined, messages: string[], result: AgentOutput, variables: AgentVariables): AgentFunctionResult {
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
        ...ChatMessageBuilder.functionCallResultWithVariables(
          name,
          result.content || "Successfully accomplished the task.",
          variables
        )
      ]
    }
  }

  onFailure(name: string, params: any, rawParams: string | undefined, error: string | undefined, variables: AgentVariables): AgentFunctionResult {
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
        ...ChatMessageBuilder.functionCallResultWithVariables(
          name,
          `Error: ${error}`,
          variables
        )
      ]
    }
  }

  buildExecutor(agent: Agent, context: AgentContext) {
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
          result.error,
          context.variables
        );
      } else {
        return this.onSuccess(
          this.name,
          rawParams,
          [],
          result.value.output,
          context.variables
        );
      }
    }
  }
}

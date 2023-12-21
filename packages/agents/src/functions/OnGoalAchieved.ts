import { AgentOutputType, ChatMessageBuilder } from "@/agent-core"
import { ScriptFunction } from "./utils";
import { Agent } from "../agents/utils";

interface OnGoalAchievedFuncParameters { 
  message: string
};

export class OnGoalAchievedFunction extends ScriptFunction<OnGoalAchievedFuncParameters> {
  name: string = "agent_onGoalAchieved";
  description: string = "Informs the user that the goal has been achieved. Returns as message a complete and explicit answer for user's question";
  parameters: any = {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "Complete and explicit answer for user's question",
      },
    },
    required: ["message"],
    additionalProperties: false,
  };

  onSuccess(
    agent: Agent,
    params: OnGoalAchievedFuncParameters,
    rawParams: string | undefined,
    result: string
  ) {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `[${agent.config.prompts.name}] ${this.name}`,
          content: params.message,
        },
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ChatMessageBuilder.functionCallResult(this.name, result),
      ],
    };
  }

  onFailure(
    agent: Agent,
    params: OnGoalAchievedFuncParameters,
    rawParams: string | undefined,
    error: string
  ) {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `[${agent.config.prompts.name}] Error in ${this.name}: ${error}`,
          content: params.message,
        },
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ChatMessageBuilder.functionCallResult(
          this.name,
          `Failed calling ${this.name}:\n${error}`
        ),
      ],
    };
  }
}

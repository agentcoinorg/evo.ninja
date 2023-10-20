import { AgentOutputType } from "@evo-ninja/agent-utils"
import { ScriptFunction } from "../scriptedAgents/ScriptFunction"
import { Agent } from "../Agent";

interface OnGoalAchievedFuncParameters { 
  message: string
};

export class OnGoalAchievedFunction extends ScriptFunction<OnGoalAchievedFuncParameters> {

  name: string = "agent_onGoalAchieved";
  parameters: any = {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "information about how the goal was achieved"
      }
    },
    required: ["message"],
    additionalProperties: false
  };

  onSuccess(agent: Agent, params: OnGoalAchievedFuncParameters, rawParams: string | undefined, result: string) {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `[${agent.config.prompts.name}] ${this.name}`,
          content: params.message
        }
      ],
      messages: []
    }
  }

  onFailure(agent: Agent, params: OnGoalAchievedFuncParameters, rawParams: string | undefined, error: string) {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `[${agent.config.prompts.name}] Error in ${this.name}: ${error}`,
          content: params.message
        }
      ],
      messages: []
    }
  }
}

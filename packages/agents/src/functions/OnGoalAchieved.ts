import { AgentOutputType } from "@evo-ninja/agent-utils"
import { ScriptedAgent } from "../scriptedAgents"
import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

interface OnGoalAchievedFuncParameters { 
  message: string
};

export class OnGoalAchievedFunction extends ScriptFunction<OnGoalAchievedFuncParameters> {

  name: string = "agent_onGoalAchieved";
  description: string = "Informs the user that the goal has been achieved.";
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

  onSuccess(scriptedAgent: ScriptedAgent, params: OnGoalAchievedFuncParameters, rawParams: string | undefined, result: string) {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `[${scriptedAgent.config.prompts.name}] ${this.name}`,
          content: params.message
        }
      ],
      messages: []
    }
  }

  onFailure(scriptedAgent: ScriptedAgent, params: OnGoalAchievedFuncParameters, rawParams: string | undefined, error: string) {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `[${scriptedAgent.config.prompts.name}] Error in ${this.name}: ${error}`,
          content: params.message
        }
      ],
      messages: []
    }
  }
}

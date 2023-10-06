import { AgentOutputType } from "@evo-ninja/agent-utils"
import { ScriptFunction } from "../ScriptFunction"
import { ScriptedAgent } from "../ScriptedAgent"

interface OnGoalFailedFuncParameters { 
  message: string
};

export class OnGoalFailedFunction extends ScriptFunction<{}> {
  get name() {
    return "agent_onGoalFailed"
  }

  get description() {
    return "Informs the user that the agent could not achieve the goal."
  }

  get parameters() {
    return {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "information about how the goal was achieved"
        }
      },
      required: ["message"],
      additionalProperties: false
    }
  }

  onSuccess(scriptedAgent: ScriptedAgent, params: OnGoalFailedFuncParameters, result: string) {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `[${scriptedAgent.name}] ${this.name}`,
          content: params.message
        }
      ],
      messages: []
    }
  }

  onFailure(scriptedAgent: ScriptedAgent, params: OnGoalFailedFuncParameters, error: string) {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `[${scriptedAgent.name}] Error in ${this.name}: ${error}`,
          content: params.message
        }
      ],
      messages: []
    }
  }
}

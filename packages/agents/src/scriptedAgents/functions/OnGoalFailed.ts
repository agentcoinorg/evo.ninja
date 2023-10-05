import { AgentOutputType } from "@evo-ninja/agent-utils"
import { ScriptFunction } from "../ScriptFunction"
import { ScriptedAgent } from "../ScriptedAgent"

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
      properties: { },
    }
  }

  onSuccess(scriptedAgent: ScriptedAgent, params: any, result: string) {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `[${scriptedAgent.name}] ${this.name}`
        }
      ],
      messages: []
    }
  }

  onFailure(scriptedAgent: ScriptedAgent, params: any, error: string) {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `[${scriptedAgent.name}] Error in ${this.name}: ${error}`
        }
      ],
      messages: []
    }
  }
}
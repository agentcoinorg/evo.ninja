import { AgentOutputType } from "@evo-ninja/agent-utils"
import { ScriptedAgent } from ".."
import { ScriptFunction } from "../ScriptFunction"

export class OnGoalAchievedFunction extends ScriptFunction<{}> {
  get name() {
    return "agent_onGoalAchieved"
  }

  get description() {
    return "Informs the user that the goal has been achieved."
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
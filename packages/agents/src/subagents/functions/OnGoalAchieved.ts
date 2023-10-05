import { AgentOutputType } from "@evo-ninja/agent-utils"
import { SubAgent } from ".."
import { SubAgentFunctionBase } from "../SubAgentFunction"

export class OnGoalAchievedFunction extends SubAgentFunctionBase<{}> {
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

  onSuccess(subAgent: SubAgent, params: any, result: string) {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `[${subAgent.name}] ${this.name}`
        }
      ],
      messages: []
    }
  }

  onFailure(subAgent: SubAgent, params: any, error: string) {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `[${subAgent.name}] Error in ${this.name}: ${error}`
        }
      ],
      messages: []
    }
  }
}
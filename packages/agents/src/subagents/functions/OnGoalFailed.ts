import { AgentOutputType } from "@evo-ninja/agent-utils"
import { SubAgentFunctionBase } from "../SubAgentFunction"
import { SubAgent } from "../SubAgent"

export class OnGoalFailedFunction extends SubAgentFunctionBase<{}> {
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
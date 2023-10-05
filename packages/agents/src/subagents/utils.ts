import { AgentOutputType } from "@evo-ninja/agent-utils"
import { ON_GOAL_ACHIEVED_FN_NAME, ON_GOAL_FAILED_FN_NAME } from "./constants"

export const createOnGoalAchievedFunction = (agentName: string) => {
  return {
    ...getDefaultFunctionBase(agentName),
    name: ON_GOAL_ACHIEVED_FN_NAME,
    description: "Informs the user that the goal has been achieved.",
  }
}

export const createOnGoalFailedFunction = (agentName: string) => {
  return {
    ...getDefaultFunctionBase(agentName),
    name: ON_GOAL_FAILED_FN_NAME,
    description: "Informs the user that the agent could not achieve the goal.",
  }
}

const getDefaultFunctionBase = (agentName: string) => {
  const parameters = {
    type: "object",
    properties: { },
  };

  const success = () => ({
    outputs: [
      {
        type: AgentOutputType.Success,
        title: `[${agentName}] ${ON_GOAL_ACHIEVED_FN_NAME}`
      }
    ],
    messages: []
  })

  const failure = (_: any, error: string) => ({
    outputs: [
      {
        type: AgentOutputType.Error,
        title: `[${agentName}] Error in ${ON_GOAL_ACHIEVED_FN_NAME}: ${error}`
      }
    ],
    messages: []
  })

  return {
    parameters,
    success,
    failure
  }
}
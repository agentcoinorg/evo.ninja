import { createScriptExecutor } from "./util";
import { AgentContext } from "../AgentContext";

import {
  AgentFunction,
  AgentFunctionResult,
  AgentOutputType
} from "@evo-ninja/agent-utils";

const FN_NAME = "agent_onGoalAchieved";

const SUCCESS = (): AgentFunctionResult => ({
  outputs: [
    {
      type: AgentOutputType.Success,
      title: "[dev] agent_onGoalAchieved"
    }
  ],
  messages: []
});

export const agent_onGoalAchieved: AgentFunction<AgentContext> = {
  definition: {
    name: FN_NAME,
    description: "Informs the user that the goal has been achieved.",
    parameters: {
      type: "object",
      properties: { },
    }
  },
  buildExecutor(context: AgentContext) {
    return createScriptExecutor(
      context.scripts,
      context.client,
      "agent.onGoalAchieved",
      () => SUCCESS()
    );
  }
};

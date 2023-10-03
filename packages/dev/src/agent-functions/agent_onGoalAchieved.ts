import { createScriptExecutor } from "./util";
import { AgentContext } from "../AgentContext";

import {
  AgentFunction,
  AgentFunctionResult,
} from "@evo-ninja/agent-utils";

const FN_NAME = "agent_onGoalAchieved";

const SUCCESS = (): AgentFunctionResult => ({
  outputs: [],
  messages: []
});

export const agent_onGoalAchieved: AgentFunction<AgentContext> = {
  definition: {
    name: FN_NAME,
    description: "Informs the user that the goal has been achieved.",
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

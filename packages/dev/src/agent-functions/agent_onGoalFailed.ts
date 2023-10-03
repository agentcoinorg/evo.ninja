import { createScriptExecutor } from "./util";
import { AgentContext } from "../AgentContext";

import {
  AgentFunction,
  AgentFunctionResult,
} from "@evo-ninja/agent-utils";

const FN_NAME = "agent_onGoalFailed";

const SUCCESS = (): AgentFunctionResult => ({
  outputs: [],
  messages: []
});

export const agent_onGoalFailed: AgentFunction<AgentContext> = {
  definition: {
    name: FN_NAME,
    description: "Informs the user that the agent could not achieve the goal.",
  },
  buildExecutor(context: AgentContext) {
    return createScriptExecutor(
      context.scripts,
      context.client,
      "agent.onGoalFailed",
      () => SUCCESS()
    );
  }
};

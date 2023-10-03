import { createScriptExecutor } from "./util";
import { AgentContext } from "../AgentContext";

import {
  AgentFunction,
  AgentFunctionResult,
  AgentOutputType
} from "@evo-ninja/agent-utils";

const FN_NAME = "agent_onGoalFailed";

const SUCCESS = (): AgentFunctionResult => ({
  outputs: [
    {
      type: AgentOutputType.Error,
      title: "[dev] agent_onGoalFailed"
    }
  ],
  messages: []
});

export const agent_onGoalFailed: AgentFunction<AgentContext> = {
  definition: {
    name: FN_NAME,
    description: "Informs the user that the agent could not achieve the goal.",
    parameters: {
      type: "object",
      properties: { },
    }
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

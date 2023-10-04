import { BaseAgent } from "../BaseAgent";
import { ON_GOAL_ACHIEVED_FN_NAME, ON_GOAL_FAILED_FN_NAME } from "./constants";
import { createScriptExecutor } from "./utils";
import { Scripts, WrapClient, ChatRole } from "@evo-ninja/agent-utils";
import { BaseAgentContext } from "../BaseAgent";
import { AgentFunction } from "../types";

export interface SubAgentContext extends BaseAgentContext {
  scripts: Scripts;
  client: WrapClient;
}

export interface SubAgentFunctions extends Record<string, AgentFunction> {
  agent_onGoalAchieved: AgentFunction;
  agent_onGoalFailed: AgentFunction;
};

export interface SubAgentConfig {
  initialMessages: (runArguments: SubAgentRunArgs) => { role: ChatRole; content: string }[];
  loopPreventionPrompt: string;
  functions: SubAgentFunctions;
}

export interface SubAgentRunArgs {
  goal: string;
}

export class SubAgent<TAgentContext extends SubAgentContext = SubAgentContext> extends BaseAgent<SubAgentRunArgs, SubAgentContext> {
  constructor(
    config: SubAgentConfig,
    context: TAgentContext,
  ) {
    const functionsEntries = Object.entries(config.functions).map(([name, definition]) => {
      return [name, {
        definition: {
          ...definition,
          name
        },
        buildExecutor: (context: TAgentContext) => {
          return createScriptExecutor({
            context,
            scriptName: name.split("_").join("."),
            onSuccess: definition.success
          });
        }
      }]
    })

    super({
      ...config,
      shouldTerminate: (functionCalled) => {
        return [
          ON_GOAL_ACHIEVED_FN_NAME,
          ON_GOAL_FAILED_FN_NAME
        ].includes(functionCalled.name);
      },
      functions: Object.fromEntries(functionsEntries),
    }, context);
  }
}

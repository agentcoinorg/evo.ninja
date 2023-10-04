import { AgentBase } from "../AgentBase";
import { ON_GOAL_ACHIEVED_FN_NAME, ON_GOAL_FAILED_FN_NAME } from "./constants";
import { createScriptExecutor } from "./utils";
import { Scripts, WrapClient, ChatRole, AgentFunctionResult } from "@evo-ninja/agent-utils";
import { AgentBaseContext } from "../AgentBase";
import { AgentFunction } from "../types";

export interface SubAgentContext extends AgentBaseContext {
  scripts: Scripts;
  client: WrapClient;
}

export interface SubAgentFunction extends AgentFunction {
  success: (params: Record<string, any>) => AgentFunctionResult;
}

export interface SubAgentFunctions extends Record<string, SubAgentFunction> {
  agent_onGoalAchieved: SubAgentFunction;
  agent_onGoalFailed: SubAgentFunction;
};

export interface SubAgentConfig {
  initialMessages: (runArguments: SubAgentRunArgs) => { role: ChatRole; content: string }[];
  loopPreventionPrompt: string;
  functions: SubAgentFunctions;
}

export interface SubAgentRunArgs {
  goal: string;
}

export class SubAgent<TAgentContext extends SubAgentContext = SubAgentContext> extends AgentBase<SubAgentRunArgs, SubAgentContext> {
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

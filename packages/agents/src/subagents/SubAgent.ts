import { AgentBase } from "../AgentBase";
import { ON_GOAL_ACHIEVED_FN_NAME, ON_GOAL_FAILED_FN_NAME } from "./constants";
import { buildScriptExecutor } from "./buildScriptExecutor";
import { AgentBaseContext } from "../AgentBase";

import { Scripts, WrapClient, ChatRole, AgentFunctionDefinition, AgentFunctionResult, agentPlugin } from "@evo-ninja/agent-utils";

export interface SubAgentContext extends AgentBaseContext {
  scripts: Scripts;
  client: WrapClient;
}

export interface SubAgentFunction extends AgentFunctionDefinition {
  success: (params: Record<string, any>, result?: string) => AgentFunctionResult;
  failure: (params: Record<string, any>, error: string) => AgentFunctionResult;
}

export interface SubAgentFunctions extends Record<string, SubAgentFunction> {
  agent_onGoalAchieved: SubAgentFunction;
  agent_onGoalFailed: SubAgentFunction;
};

export interface SubAgentConfig {
  name: string;
  expertise: string;
  initialMessages: (runArguments: SubAgentRunArgs) => { role: ChatRole; content: string }[];
  loopPreventionPrompt: string;
  functions: SubAgentFunction[];
}

export interface SubAgentRunArgs {
  goal: string;
}

export class SubAgent extends AgentBase<SubAgentRunArgs, SubAgentContext> {
  constructor(
    config: SubAgentConfig,
    context: SubAgentContext,
  ) {
    const functions = config.functions.map((definition) => {
      return {
        definition,
        buildExecutor: (context: SubAgentContext) => {
          return buildScriptExecutor({
            context,
            scriptName: definition.name.split("_").join("."),
            onSuccess: definition.success,
            onFailure: definition.failure
          });
        }
      }
    })

    super({
      ...config,
      shouldTerminate: (functionCalled) => {
        return [
          ON_GOAL_ACHIEVED_FN_NAME,
          ON_GOAL_FAILED_FN_NAME
        ].includes(functionCalled.name);
      },
      functions,
    }, context);
  }

  public static create(
    config: SubAgentConfig,
    context: Omit<SubAgentContext, "client">
  ): SubAgent {
    return new SubAgent(config, {
      ...context,
      client: new WrapClient(
        context.workspace,
        context.logger,
        agentPlugin({ logger: context.logger }),
        context.env
      )
    });
  }
}

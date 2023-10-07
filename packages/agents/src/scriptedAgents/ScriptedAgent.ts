import { AgentBase } from "../AgentBase";
import { AgentBaseContext } from "../AgentBase";

import { Scripts, WrapClient, ChatRole, agentPlugin, ExecuteAgentFunctionCalled } from "@evo-ninja/agent-utils";
import { ScriptFunction } from "./ScriptFunction";

export interface ScriptedAgentContext extends AgentBaseContext {
  scripts: Scripts;
  client: WrapClient;
}

export interface ScriptedAgentConfig {
  name: string;
  expertise: string;
  constraintMessages: (runArguments: ScriptedAgentRunArgs) => { role: ChatRole; content: string }[];
  persistentMessages: (runArguments: ScriptedAgentRunArgs) => { role: ChatRole; content: string }[];
  loopPreventionPrompt: string;
  agentSpeakPrompt?: string;
  shouldTerminate: (functionCalled: ExecuteAgentFunctionCalled) => boolean;
  functions: ScriptFunction<unknown>[];
}

export interface ScriptedAgentRunArgs {
  goal: string;
}

export class ScriptedAgent extends AgentBase<ScriptedAgentRunArgs, ScriptedAgentContext> {

  constructor(
    config: ScriptedAgentConfig,
    context: ScriptedAgentContext,
  ) {
    super(config, context);
  }

  public static create(
    config: ScriptedAgentConfig,
    context: Omit<ScriptedAgentContext, "client">
  ): ScriptedAgent {
    return new ScriptedAgent(config, {
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

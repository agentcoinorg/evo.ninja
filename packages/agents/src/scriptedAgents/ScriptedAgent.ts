import { AgentBase } from "../AgentBase";
import { AgentBaseContext } from "../AgentBase";

import { Scripts, WrapClient, agentPlugin, ExecuteAgentFunctionCalled, ChatMessage } from "@evo-ninja/agent-utils";
import { ScriptFunction } from "./ScriptFunction";

export interface ScriptedAgentContext extends AgentBaseContext {
  scripts: Scripts;
  client: WrapClient;
}

export interface ScriptedAgentConfig {
  name: string;
  expertise: string;
  initialMessages: (runArguments: ScriptedAgentRunArgs) => ChatMessage[];
  loopPreventionPrompt: string;
  agentSpeakPrompt?: string;
  shouldTerminate: (functionCalled: ExecuteAgentFunctionCalled) => boolean;
  functions: ScriptFunction<unknown>[];
}

export interface ScriptedAgentRunArgs {
  goal: string;
  initialMessages?: ChatMessage[]
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

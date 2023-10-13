import { AgentBase } from "../AgentBase";
import { AgentBaseContext } from "../AgentBase";

import { ChatMessage, ExecuteAgentFunctionCalled, Scripts, WrapClient } from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../AgentFunctionBase";

export interface ScriptedAgentConfig {
  name: string;
  expertise: string;
  initialMessages: (runArguments: ScriptedAgentRunArgs) => ChatMessage[];
  loopPreventionPrompt: string;
  agentSpeakPrompt?: string;
  shouldTerminate: (functionCalled: ExecuteAgentFunctionCalled) => boolean;
  functions: AgentFunctionBase<unknown>[];
}

export interface ScriptedAgentContext extends AgentBaseContext {
  scripts: Scripts;
  client: WrapClient;
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
    context: ScriptedAgentContext
  ): ScriptedAgent {
    return new ScriptedAgent(config, context);
  }
}

export type ScriptedAgentOrFactory = (ScriptedAgent | (() => ScriptedAgent));

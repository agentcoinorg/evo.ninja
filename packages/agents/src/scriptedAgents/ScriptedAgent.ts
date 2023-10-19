import { AgentBase, AgentPrompts } from "../AgentBase";
import { AgentBaseContext } from "../AgentBase";

import { ChatMessage, ExecuteAgentFunctionCalled } from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../AgentFunctionBase";

export interface ScriptedAgentConfig {
  prompts: AgentPrompts<ScriptedAgentRunArgs>;
  shouldTerminate: (functionCalled: ExecuteAgentFunctionCalled) => boolean;
  functions: AgentFunctionBase<unknown>[];
}

export interface ScriptedAgentRunArgs {
  goal: string;
  initialMessages?: ChatMessage[]
}

export class ScriptedAgent extends AgentBase<ScriptedAgentRunArgs, AgentBaseContext> {
  constructor(
    config: ScriptedAgentConfig,
    context: AgentBaseContext,
  ) {
    super(config, context);
  }

  public static create(
    config: ScriptedAgentConfig,
    context: AgentBaseContext
  ): ScriptedAgent {
    return new ScriptedAgent(config, context);
  }
}

export type ScriptedAgentOrFactory = (ScriptedAgent | (() => ScriptedAgent));

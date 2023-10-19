import { AgentBase } from "../AgentBase";
import { AgentBaseContext } from "../AgentBase";

import { ChatMessage } from "@evo-ninja/agent-utils";

export interface ScriptedAgentRunArgs {
  goal: string;
  initialMessages?: ChatMessage[]
}

export type ScriptedAgent = AgentBase<ScriptedAgentRunArgs, AgentBaseContext>;

export type ScriptedAgentOrFactory = (ScriptedAgent | (() => ScriptedAgent));

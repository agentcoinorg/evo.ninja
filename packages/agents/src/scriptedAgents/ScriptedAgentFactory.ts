import { AgentBaseContext } from "../AgentBase";
import { ScriptedAgent } from "./ScriptedAgent";

export type ScriptedAgentFactory = (context: AgentBaseContext) => ScriptedAgent;

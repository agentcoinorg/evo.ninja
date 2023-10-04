import { delegateSubAgent } from "./delegateSubAgent";
import { createScript } from "./createScript";
import { executeScript } from "./executeScript";
import { findScript } from "./findScript";
import { readVar } from "./readVar";
import { AgentContext } from "../AgentContext";
import { AgentFunction } from "@evo-ninja/agent-utils";
import { ScriptWriter } from "@evo-ninja/js-script-writer-agent";
import {
  DEV_AGENT_CONFIG,
  RESEARCH_AGENT_CONFIG
} from "@evo-ninja/subagents";

export function agentFunctions(createScriptWriter: () => ScriptWriter): AgentFunction<AgentContext>[] {
  return [
    createScript(createScriptWriter),
    executeScript,
    findScript,
    readVar,
    delegateSubAgent(
      "Developer",
      "developing software",
      DEV_AGENT_CONFIG
    ),
    delegateSubAgent(
      "Researcher",
      "researching information online",
      RESEARCH_AGENT_CONFIG
    )
  ];
}

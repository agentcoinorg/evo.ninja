import { createScript } from "./createScript";
import { executeScript } from "./executeScript";
import { findScript } from "./findScript";
import { readVariable } from "./readVariable";
import { AgentContext } from "../AgentContext";
import { AgentFunction } from "@evo-ninja/agent-utils";
import { ScriptWriter } from "@evo-ninja/agents";

export function agentFunctions(createScriptWriter: () => ScriptWriter): AgentFunction<AgentContext>[] {
  return [
    createScript(createScriptWriter),
    executeScript,
    findScript,
    readVariable,
  ];
}

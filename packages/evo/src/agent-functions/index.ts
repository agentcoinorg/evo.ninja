import { createScript } from "./createScript";
import { executeScript } from "./executeScript";
import { findScript } from "./findScript";
import { readVar } from "./readVar";
import { AgentContext } from "../AgentContext";
import { AgentFunction } from "@evo-ninja/agent-utils";
import { ScriptWriter } from "@evo-ninja/js-script-writer-agent";

export function agentFunctions(createScriptWriter: () => ScriptWriter): AgentFunction<AgentContext>[] {
  return [
    createScript(createScriptWriter),
    executeScript,
    findScript,
    readVar,
  ];
}

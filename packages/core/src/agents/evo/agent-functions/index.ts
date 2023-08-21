import { createScript } from "./createScript";
import { executeScript } from "./executeScript";
import { findScript } from "./findScript";
import { readVar } from "./readVar";
import { AgentFunction } from "../../agent-function";
import { ScriptWriter } from "../../script-writer";

export function agentFunctions(createScriptWriter: () => ScriptWriter): AgentFunction[] {
  return [
    createScript(createScriptWriter),
    executeScript,
    findScript,
    readVar,
  ];
}

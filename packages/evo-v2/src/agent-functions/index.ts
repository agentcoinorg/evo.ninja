import { createFunction } from "./createFunction";
import { findFunction } from "./findFunction";
import { readVar } from "./readVar";
import { AgentContext } from "../AgentContext";
import { AgentFunction } from "@evo-ninja/agent-utils";
import { ScriptWriter } from "@evo-ninja/script-writer-agent";

export function agentFunctions(createScriptWriter: () => ScriptWriter): AgentFunction<AgentContext>[] {
  return [
    createFunction(createScriptWriter),
    findFunction,
    readVar,
  ];
}

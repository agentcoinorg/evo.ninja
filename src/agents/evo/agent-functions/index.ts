import { createScript } from "./createScript";
import { executeScript } from "./executeScript";
import { findScript } from "./findScript";
import { readVar } from "./readVar";
import { AgentFunction } from "../../../agent-function";

export const agentFunctions: AgentFunction[] = [
  createScript,
  executeScript,
  findScript,
  readVar,
];

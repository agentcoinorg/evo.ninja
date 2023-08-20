import { AgentFunction } from "../../agent-function";
import { createScript } from "./createScript";
import { executeScript } from "./executeScript";
import { findScript } from "./findScript";
import { readVar } from "./readVar";

export const agentFunctions: AgentFunction[] = [
  createScript,
  executeScript,
  findScript,
  readVar,
];

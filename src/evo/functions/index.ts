import { AgentFunction } from "../../functions";
import { createScript } from "./createScript";
import { executeScript } from "./executeScript";
import { findScript } from "./findScript";
import { readVar } from "./readVar";

export const functions: AgentFunction[] = [
  createScript,
  executeScript,
  findScript,
  readVar,
];

import { AgentFunction } from "../../functions";
import { createOperation } from "./createOperation";
import { executeOperation } from "./executeOperation";
import { findOperation } from "./findOperation";
import { readVar } from "./readVar";

export const functions: AgentFunction[] = [
  createOperation,
  executeOperation,
  findOperation,
  readVar,
];


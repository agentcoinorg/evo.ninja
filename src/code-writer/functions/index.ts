import { AgentFunction } from "../../functions";
import { think } from "./think";
import { writeFunction } from "./writeFunction";

export const functions: AgentFunction[] = [
  writeFunction,
  think,
];

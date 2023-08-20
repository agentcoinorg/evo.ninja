import { think } from "./think";
import { writeFunction } from "./writeFunction";
import { AgentFunction } from "../../agent-function";

export const agentFunctions: AgentFunction[] = [
  writeFunction,
  think,
];

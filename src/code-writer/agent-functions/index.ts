import { AgentFunction } from "../../agent-function";
import { think } from "./think";
import { writeFunction } from "./writeFunction";

export const agentFunctions: AgentFunction[] = [
  writeFunction,
  think,
];

import { AgentFunction } from "@evo-ninja/agent-utils";
import { AgentContext } from "../AgentContext";
import { think } from "./think";
import { writeFunction } from "./writeFunction";

export const agentFunctions: AgentFunction<AgentContext>[] = [
  writeFunction,
  think,
];

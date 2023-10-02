import { AgentFunction } from "@evo-ninja/agent-utils";
import { AgentContext } from "../AgentContext";
import { writeFile } from "./writeFile";

export const agentFunctions: AgentFunction<AgentContext>[] = [
  writeFile
];

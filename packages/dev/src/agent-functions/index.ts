import { AgentFunction } from "@evo-ninja/agent-utils";
import { AgentContext } from "../AgentContext";
import { fs_writeFile } from "./fs_writeFile";
import { agent_onGoalAchieved } from "./agent_onGoalAchieved";
import { agent_onGoalFailed } from "./agent_onGoalFailed";

export const agentFunctions: AgentFunction<AgentContext>[] = [
  fs_writeFile,
  agent_onGoalAchieved,
  agent_onGoalFailed
];

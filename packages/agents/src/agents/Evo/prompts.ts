import { ChatMessage } from "@/agent-core";
import { GoalRunArgs } from "../../agents/utils";
import { AgentPrompts } from "../../agents/utils";

export const agentPrompts = (): AgentPrompts<GoalRunArgs> => ({
  name: "Evo",
  expertise: `an expert evolving assistant that achieves user goals`,
  initialMessages: ({ goal }: GoalRunArgs): ChatMessage[] => [],
  loopPreventionPrompt: `Assistant, you seem to be looping. Try delegating a task or calling agent_onGoalAchieved or agent_onGoalFailed`,
});

export const prompts = {
  generalAgentPersona:
    "You are an expert assistant capable of accomplishing a multitude of tasks using functions that use external tools (like internet, file system, etc.).",
  exhaustAllApproaches:
    "If you can not achieve a goal, first try to exhaust different approaches before giving up.",
  variablesExplainer:
    "Function results will be stored in variables if they are very large. Variables are declared using the syntax ${variable-name}. Variables are created as needed, DO NOT use variable names that are not previously stated. When using variables within function arguments, YOU MUST use the ${variable-name} syntax. Relevant chunks of variable data will be shown to you as needed.",
};

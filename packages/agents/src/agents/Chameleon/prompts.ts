import { ChatMessage } from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../../AgentFunctionBase";
import { GoalRunArgs } from "../../Agent";
import { AgentPrompts } from "../../AgentPrompts";

export const agentPrompts = ( 
  onGoalAchievedFn: AgentFunctionBase<any>,
  onGoalFailedFn: AgentFunctionBase<any>
): AgentPrompts<GoalRunArgs> => ({
  name: "Chameleon",
  expertise: `an expert evolving assistant that achieves user goals`,
  initialMessages: ({ goal }: GoalRunArgs): ChatMessage[] => [
  ],
  loopPreventionPrompt: `Assistant, you seem to be looping. Try delegating a task or calling agent_onGoalAchieved or agent_onGoalFailed`,
});

export const prompts = {
  generalAgentPersona: "You are an expert assistant capable of accomplishing a multitude of tasks using functions that use external tools (like internet, file system, etc.).",
  exhaustAllApproaches: "If you can not achieve a goal, first try to exhaust different approaches before giving up.",
};

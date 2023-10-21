import { ChatMessage } from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../../AgentFunctionBase";
import { GoalRunArgs } from "../../Agent";
import { AgentPrompts } from "../../AgentPrompts";

export const prompts = ( 
  onGoalAchievedFn: AgentFunctionBase<any>,
  onGoalFailedFn: AgentFunctionBase<any>
): AgentPrompts<GoalRunArgs> => ({
  name: "Chameleon",
  expertise: `an expert evolving assistant that achieves user goals`,
  initialMessages: ({ goal }: GoalRunArgs): ChatMessage[] => [
    {
      role: "user",
      content: goal,
    },
  ],
  loopPreventionPrompt: `Assistant, you seem to be looping. Try delegating a task or calling agent_onGoalAchieved or agent_onGoalFailed`,
});

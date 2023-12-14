import { ChatMessage } from "@/agent-core";
import { GoalVerifierRunArgs } from ".";
import { AgentPrompts } from "../utils";
import { AgentFunctionBase } from "../../functions/utils";

export const prompts = ( 
  onGoalAchievedFn: AgentFunctionBase<any>,
  onGoalFailedFn: AgentFunctionBase<any>,
): AgentPrompts<GoalVerifierRunArgs> => ({
  name: "GoalVerifier",
  expertise: `verifies if the users' goal has been achieved or not.`,
  initialMessages: (): ChatMessage[] => [
  ],
  runMessages: ({ messagesToVerify }: GoalVerifierRunArgs): ChatMessage[] => [
    { role: "user", content: `\`\`\`
  ${(messagesToVerify ?? []).map(x => JSON.stringify(x, null, 2 )).join("\n")}
Verify that the assistant has correctly achieved the users' goal by reading the files.
Take extra care when reviewing the formatting and constraints of the goal, both defined and implied.
Trust only what's inside of the files and not the chat messages.
If something is wrong, call ${onGoalFailedFn.name} with information as precise as you can about how the problem can be solved.
Otherwise, use ${onGoalAchievedFn.name}`
    },
  ],
  loopPreventionPrompt: `Assistant, you appear to be in a loop, try executing a different function.`,
});

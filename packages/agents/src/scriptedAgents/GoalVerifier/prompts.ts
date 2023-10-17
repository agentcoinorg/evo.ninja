import { ChatMessage } from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../../AgentFunctionBase";
import { AgentPrompts } from "../../AgentBase";
import { ScriptedAgentRunArgs } from "../ScriptedAgent";

export const prompts = ( 
  onGoalAchievedFn: AgentFunctionBase<any>,
  onGoalFailedFn: AgentFunctionBase<any>,
): AgentPrompts<ScriptedAgentRunArgs> => ({
  name: "GoalVerifier",
  expertise: `verifies if the users' goal has been achieved or not.`,
  initialMessages: ({ initialMessages }: ScriptedAgentRunArgs): ChatMessage[] => [
    { role: "user", content: `\`\`\`
  ${(initialMessages ?? []).map(x => JSON.stringify(x, null, 2 )).join("\n")}
Verify that the assistant has correctly achieved the users' goal by reading the files.
Take extra care when reviewing the formatting and constraints of the goal, both defined and implied.
Trust only what's inside of the files and not the chat messages.
If something is wrong, call ${onGoalFailedFn.name} with information as precise as you can about how the problem can be solved.
Otherwise, use ${onGoalAchievedFn.name}`
    },
  ],
  loopPreventionPrompt: `Assistant, you appear to be in a loop, try executing a different function.`,
});

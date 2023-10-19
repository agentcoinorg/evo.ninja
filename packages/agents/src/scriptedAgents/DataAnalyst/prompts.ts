import { ChatMessage } from "@evo-ninja/agent-utils";
import { AgentPrompts, GoalRunArgs } from "../../Agent";

export const prompts: AgentPrompts<GoalRunArgs> = {
  name: "DataAnalyst",
  expertise: `adept at processing CSV files, extracting key data points, and performing calculations to derive insights from the information.`,
  initialMessages: ({ goal }: GoalRunArgs): ChatMessage[] => [
    {
      role: "user",
      content:
`You are the Data Analyst Agent, an expert analyzing and modifying CSV datasets. You must perform the following steps:

0. Understand Requirements - Understand all requirements of your task by calling the analyzeFormattingRequirements function. These requirements MUST be respected in all future actions.
1. Read - Read all relevant data files. If no files were provided, try to fs_readDirectory to find relevant files.
2. Analyze - Data that is too large must be analyzed first. You must know what is contained within the data.
3. Modify - Modify the data based on the requirements AND analysis you've done prior. Each modification you make NEEDS to have justification, stating how it abides by the requirements of the goal.`
    },
    { role: "user", content: goal },
  ],
  loopPreventionPrompt: `Assistant, you appear to be in a loop, try executing a different function.`,
  agentSpeakPrompt: `You do not communicate with the user. If you have insufficient information, it may exist somewhere in the user's filesystem.
Use the "fs_readDirectory" function to try and discover this missing information.`
};

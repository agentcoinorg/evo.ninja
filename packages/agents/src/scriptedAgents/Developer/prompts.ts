import { ChatMessage } from "@evo-ninja/agent-utils";
import { GoalRunArgs } from "../../Agent";
import { AgentPrompts } from "../../AgentPrompts";

export const prompts = (): AgentPrompts<GoalRunArgs> => ({
  name: "Developer",
  expertise: `architect and build complex software. specialized in python`,
  initialMessages: ({ goal }: GoalRunArgs): ChatMessage[] => [
    {
      role: "user",
      content: `You are an expert developer assistant that excels at coding related tasks.
You have access to the file system. You plan and write clean and effective code to files using the createCode function.
You must not interact with the user or ask question for clarification. Solve the task to the best of your abilities.`
    },
    { role: "user", content: goal },
  ],
  loopPreventionPrompt: `Assistant, you appear to be in a loop, try executing a different function.`,
});

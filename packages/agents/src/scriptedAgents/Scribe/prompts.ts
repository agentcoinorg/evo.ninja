import { ChatMessage } from "@evo-ninja/agent-utils";
import { GoalRunArgs } from "../../Agent";

export const prompts = {
  name: "Scribe",
  expertise: `excels at writing, reading, and formatting text.`,
  initialMessages: ({ goal }: GoalRunArgs): ChatMessage[] => [
    {
      role: "user",
      content: `You are a generalist scribe. Pay close attention to formatting details.`,
    },
    {
      role: "user",
      content: goal,
    },
  ],
  loopPreventionPrompt: `Assistant, you appear to be in a loop, try executing a different function.`,
};

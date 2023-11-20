import { ChatMessage } from "@/agent-core";
import { GoalRunArgs } from "../utils";

export const prompts = {
  name: "Synthesizer",
  expertise: `Reads text files, analyzing and gathering data and information from text files, generating summaries and reports, and analyzing text.`,
  initialMessages: ({ goal }: GoalRunArgs): ChatMessage[] => [
    {
      role: "user",
      content: `You are a reader and synthesizer agent. Your job is to read text files, analyze text file contents`,
    },
    {
      role: "user",
      content: goal,
    },
  ],
  loopPreventionPrompt: `Assistant, you appear to be in a loop, try executing a different function.`,
};

import { ChatMessage } from "@evo-ninja/agent-utils";
import { ScriptedAgentRunArgs } from "../ScriptedAgent";
import { AgentPrompts } from "../../AgentBase";

export const prompts: AgentPrompts<ScriptedAgentRunArgs> = {
  name: "Scribe",
  expertise: `excels at writing, reading, and formatting text.`,
  initialMessages: ({ goal }: ScriptedAgentRunArgs): ChatMessage[] => [
    {
      role: "user",
      content: `You are a generalist scribe. Pay close attention to formatting details.`,
    },
    { role: "user", content: goal },
  ],
  loopPreventionPrompt: `Assistant, you appear to be in a loop, try executing a different function.`,
};

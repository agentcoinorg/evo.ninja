import { ChatMessage } from "@evo-ninja/agent-utils";

export interface AgentPrompts<TRunArgs> {
  name: string;
  expertise: string;
  initialMessages: (runArguments: TRunArgs) => ChatMessage[];
  loopPreventionPrompt: string;
  agentSpeakPrompt?: string;
}

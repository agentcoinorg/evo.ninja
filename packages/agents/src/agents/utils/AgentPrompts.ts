import { ChatMessage } from "@/agent-core";

export interface AgentPrompts<TRunArgs> {
  name: string;
  expertise: string;
  initialMessages: (runArguments: TRunArgs) => ChatMessage[];
  loopPreventionPrompt: string;
  agentSpeakPrompt?: string;
}

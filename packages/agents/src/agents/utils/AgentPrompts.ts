import { ChatMessage } from "@/agent-core";

export interface AgentPrompts<TRunArgs> {
  name: string;
  expertise: string;
  initialMessages: () => ChatMessage[];
  runMessages: (runArguments: TRunArgs) => ChatMessage[];
  loopPreventionPrompt: string;
  agentSpeakPrompt?: string;
}

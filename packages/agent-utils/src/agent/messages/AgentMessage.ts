import { ChatCompletionRequestMessage } from "openai";
import { AgentOutput } from "../AgentOutput";

export interface AgentMessage {
  output: AgentOutput;
  chatMessage: ChatCompletionRequestMessage;
}

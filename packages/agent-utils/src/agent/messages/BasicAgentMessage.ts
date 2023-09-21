import { ChatCompletionRequestMessage } from "openai";
import { ChatRole } from "../../llm";
import { AgentMessage } from "./AgentMessage";
import { AgentOutput } from "../AgentOutput";

export class BasicAgentMessage implements AgentMessage {
  constructor(public output: AgentOutput, public chatMessage: ChatCompletionRequestMessage) {
  }

  static ok(role: ChatRole, title: string, content?: string, name?: string): BasicAgentMessage {
    return new BasicAgentMessage(
      {
        type: "success",
        title,
        content
      },
      {
        role,
        name,
        content,
      }
    );
  }

  static error(role: ChatRole, title: string, content?: string): BasicAgentMessage {
    return new BasicAgentMessage(
      {
        type: "error",
        title,
        content,
      },
      {
        role,
        content
      }
    );
  }
}

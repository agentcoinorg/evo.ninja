import { ChatLogs, ChatMessage } from "../ChatLogs";
import { LlmApi } from "../LlmApi";

export class LlmQuery {
  constructor(private readonly llm: LlmApi, private logs: ChatLogs) {}

  query(): Promise<ChatMessage | undefined> {
    return this.llm.getResponse(this.logs);
  }

  async content(): Promise<string> {
    return (await this.llm.getResponse(this.logs))?.content ?? "";
  }
}

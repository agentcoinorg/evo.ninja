import { Prompt } from "@/agent-core";
import { ChatRole, ChatLogs, ChatMessage, LlmApi, Tokenizer } from "../";
import { LlmQuery } from "./LlmQuery";

export class LlmQueryBuilder {
  constructor(private readonly llm: LlmApi, private readonly tokenizer: Tokenizer, private messages: ChatMessage[] = [] ) {}

  message(role: "user" | "system" | "assistant", content: string | Prompt): LlmQueryBuilder {
    this.messages.push({ role, content: content.toString() });
    return this;
  }

  build(): LlmQuery {
    return new LlmQuery(this.llm, this.tokenizer, ChatLogs.from(this.messages, [], this.tokenizer));
  }
}

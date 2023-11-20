import { ChatRole, ChatLogs, ChatMessage, LlmApi, Tokenizer } from "../";
import { LlmQuery } from "./LlmQuery";

export class LlmQueryBuilder {
  constructor(private readonly llm: LlmApi, private readonly tokenizer: Tokenizer, private messages: ChatMessage[] = [] ) {}

  message(role: ChatRole, content: string): LlmQueryBuilder {
    this.messages.push({ role, content });
    return this;
  }

  build(): LlmQuery {
    return new LlmQuery(this.llm, this.tokenizer, ChatLogs.from(this.messages, [], this.tokenizer));
  }
}

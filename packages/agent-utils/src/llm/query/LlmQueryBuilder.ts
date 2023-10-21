import { ChatRole } from "../Chat";
import { ChatLogs, ChatMessage } from "../ChatLogs";
import { LlmApi } from "../LlmApi";
import { Tokenizer } from "../Tokenizer";
import { LlmQuery } from "./LlmQuery";

export class LlmQueryBuilder {
  constructor(private readonly llm: LlmApi, private readonly tokenizer: Tokenizer, private logs: ChatLogs = new ChatLogs() ) {}

  persistent(role: ChatRole, content: string): LlmQueryBuilder {
    this.logs.add(
      "persistent", 
      { 
        tokens: this.tokenizer.encode(content).length,
        msgs: [{ role, content }]
      });
    return this;
  }

  temporary(role: ChatRole, content: string): LlmQueryBuilder {
    this.logs.add(
      "temporary", 
      { 
        tokens: this.tokenizer.encode(content).length,
        msgs: [{ role, content }]
      });
    return this;
  }

  build(): LlmQuery {
    return new LlmQuery(this.llm, this.tokenizer, this.logs);
  }
}

export class LlmQueryBuilderV2 {
  constructor(private readonly llm: LlmApi, private readonly tokenizer: Tokenizer, private messages: ChatMessage[] = [] ) {}

  message(role: ChatRole, content: string): LlmQueryBuilderV2 {
    this.messages.push({ role, content });
    return this;
  }

  build(): LlmQuery {
    return new LlmQuery(this.llm, this.tokenizer, ChatLogs.from(this.messages, [], this.tokenizer));
  }
}

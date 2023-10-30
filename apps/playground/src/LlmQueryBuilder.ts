import { LlmApi, Tokenizer, ChatLogs, ChatRole, ChatMessage } from "@evo-ninja/agent-utils";
import { LlmQuery } from "./LlmQuery";
import { Prompt } from "@evo-ninja/agents/build/agents/Chameleon/Prompt";

export class LlmQueryBuilder {
  constructor(private readonly llm: LlmApi, private readonly tokenizer: Tokenizer, private logs: ChatLogs = new ChatLogs() ) {}

  persistent(role: ChatRole, content: string | Prompt): LlmQueryBuilder {
    const text = content.toString();
    this.logs.add(
      "persistent", 
      [{ role, content: text }],
      [this.tokenizer.encode(text).length]
    );
    return this;
  }

  temporary(role: ChatRole, content: string): LlmQueryBuilder {
    this.logs.add(
      "temporary",
      [{ role, content }],
      [this.tokenizer.encode(content).length]
    );
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

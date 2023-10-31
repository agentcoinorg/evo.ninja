import { ChatLogs, ChatMessage, Tokenizer, LlmApi, LlmModel } from "../";

export class LlmQuery {
  constructor(
    private readonly llm: LlmApi,
    private tokenizer: Tokenizer,
    private logs: ChatLogs = new ChatLogs()
  ) {}

  async content(opts?: {
    maxResponseTokens?: number;
    model?: LlmModel;
  }): Promise<string> {
    const response = await this.response(opts);

    return response?.content ?? "";
  }

  async response(opts?: {
    maxResponseTokens?: number;
    model?: LlmModel;
  }): Promise<ChatMessage | undefined> {
    const response = await this.llm.getResponse(this.logs, undefined, opts);

    if (!response || !response.content) {
      throw new Error("No response from LLM");
    }

    this.logs.add(
      "temporary",
      [{ role: response.role, content: response.content }],
      [this.tokenizer.encode(response.content).length]
    );

    return response;
  }

  async ask(
    question: string,
    opts?: { maxResponseTokens?: number; model?: LlmModel }
  ): Promise<string> {
    this.logs.add(
      "temporary",
      [{ role: "user", content: question }],
      [this.tokenizer.encode(question).length]
    );

    const response = await this.llm.getResponse(this.logs, undefined, {
      max_tokens: opts?.maxResponseTokens,
      model: opts?.model,
    });

    if (!response || !response.content) {
      throw new Error("No response from LLM");
    }

    this.logs.add(
      "temporary",
      [{ role: response.role, content: response.content }],
      [this.tokenizer.encode(response.content).length]
    );

    return response?.content ?? "";
  }
}

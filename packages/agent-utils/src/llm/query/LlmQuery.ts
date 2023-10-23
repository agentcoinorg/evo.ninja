import { ChatLogs, ChatMessage, Tokenizer, LlmApi } from "../";

export class LlmQuery {
  constructor(private readonly llm: LlmApi, private tokenizer: Tokenizer, private logs: ChatLogs = new ChatLogs()) {}

  async content(): Promise<string> {
    const response = await this.response();

    return response?.content ?? "";
  }
  
  async response(): Promise<ChatMessage | undefined> {
    const response = await this.llm.getResponse(this.logs);
  
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

  async ask(question: string, maxResponseTokens?: number): Promise<string> {
    this.logs.add(
      "temporary", 
      [{ role: "user", content: question }],
      [this.tokenizer.encode(question).length]
    );

    const response = await this.llm.getResponse(this.logs, undefined, { max_tokens: maxResponseTokens});
  
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

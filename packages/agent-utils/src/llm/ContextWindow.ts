import {
  ChatLog,
  ChatLogs,
  ChatMessage,
  LlmApi,
  Tokenizer
} from ".";

export class ContextWindow {
  private _maxContextTokens: number;
  private _summaryTokens: number;
  private _chunkTokens: number;

  constructor(
    private _llm: LlmApi
  ) {
    this._maxContextTokens = this._llm.getMaxContextTokens();

    // Summary size should be ~10% of total tokens
    const summaryPerc = 0.10;
    this._summaryTokens = Math.floor(
      this._maxContextTokens * summaryPerc
    );

    // Chunk size should be ~70% of total tokens
    const chunkPerc = 0.7;
    this._chunkTokens = Math.floor(
      this._maxContextTokens * chunkPerc
    );
  }

  public get maxContextTokens(): number {
    return this._maxContextTokens;
  }

  public shouldChunk(tokens: number): boolean {
    return tokens > this._chunkTokens;
  }

  public chunk(msg: ChatMessage, tokenizer: Tokenizer): ChatLog {
    const chunks: ChatLog = {
      tokens: 0,
      msgs: []
    };
    let content = msg.content || "";

    while (content.length > 0) {
      // Slice a chunk
      const contentChunk = content.slice(0, this._chunkTokens);

      // Append the chunk
      chunks.tokens += tokenizer.encode(contentChunk).length;
      chunks.msgs.push({
        ...msg,
        content: contentChunk
      });

      // Remove the chunk
      content = content.slice(this._chunkTokens);
    }

    return chunks;
  }

  public shouldSummarize(tokens: number): boolean {
    return (tokens + this._llm.getMaxResponseTokens()) >= this._maxContextTokens;
  }

  public async summarizeChat(
    chatLogs: ChatLogs,
    tokenizer: Tokenizer
  ): Promise<ChatLogs> {
    // Start with "temporary" messages
    const sumTemporary = await this._summarize(
      chatLogs.get("temporary"),
      tokenizer
    );

    let newChatLogs = new ChatLogs({
      "persistent": chatLogs.get("persistent"),
      "temporary": sumTemporary
    });

    if (newChatLogs.tokens < this._maxContextTokens) {
      return newChatLogs;
    }

    // Move onto "persistent" messages
    const sumPersistent = await this._summarize(
      chatLogs.get("persistent"),
      tokenizer
    );

    return new ChatLogs({
      "persistent": sumPersistent,
      "temporary": sumTemporary
    });
  }

  private async _summarize(
    chatLog: ChatLog,
    tokenizer: Tokenizer
  ): Promise<ChatLog> {
    const message = await this._summarizeMessages(chatLog, tokenizer);

    if (message?.content) {
      message.content = `Summarization: ${message?.content || ""}`
    }

    const tokens = tokenizer.encode(message?.content || "").length;

    return {
      tokens,
      msgs: message ? [message] : []
    };
  }

  private async _summarizeMessages(
    chatLog: ChatLog,
    tokenizer: Tokenizer
  ): Promise<ChatMessage | undefined> {
    let result: ChatMessage | undefined;
    let queue = chatLog.msgs;

    // While we still have more than 1 message to summarize
    while (queue.length > 1) {
      // Aggregate as many messages as possible,
      // based on max size of the context window
      const toSummarize: ChatMessage[] = [];
      let tokenCounter = 0;
      let index = 0;

      while (index < queue.length) {
        const msg = queue[index];
        const content = msg.content || "";
        const contentTokens = tokenizer.encode(content).length;

        if ((tokenCounter + contentTokens) > (this._maxContextTokens - this._summaryTokens)) {
          break;
        }

        toSummarize.push(msg);
        tokenCounter += contentTokens
        index++;
      }

      // Summarize
      const toSummarizeLogs = new ChatLogs();
      toSummarizeLogs.add("persistent", {
        msgs: toSummarize,
        tokens: tokenCounter
      });
      const message = await this._llm.getResponse(
        toSummarizeLogs,
        undefined,
        {
          temperature: 0,
          max_tokens: this._summaryTokens
        }
      );

      // Remove messages from the queue
      queue = queue.splice(index);

      // Add the new message to the queue
      if (message) {
        queue = [
          message,
          ...queue
        ];
      }
    }

    if (queue.length > 0) {
      result = queue[0];
    }

    return result;
  }
}

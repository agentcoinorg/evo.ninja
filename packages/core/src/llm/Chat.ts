import { LlmApi, Tokenizer } from ".";
import { Workspace, Logger } from "../sys";

import {
  ChatCompletionRequestMessageRoleEnum,
  ChatCompletionRequestMessage as Message
} from "openai";

export { Message };

export type MessageType =
  | "persistent"
  | "temporary";

interface MessageLog {
  tokens: number;
  msgs: Message[];
}

export class Chat {
  private _msgLogs: Record<MessageType, MessageLog> = {
    "persistent": {
      tokens: 0,
      msgs: []
    },
    "temporary": {
      tokens: 0,
      msgs: []
    }
  };
  private _maxContextTokens: number;
  private _summaryTokens: number;
  private _chunkTokens: number;

  constructor(
    private _workspace: Workspace,
    private _llm: LlmApi,
    private _tokenizer: Tokenizer,
    private _logger: Logger,
    private _msgsFile: string = ".msgs",
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

  get tokenizer(): Tokenizer {
    return this._tokenizer;
  }

  get messages(): Message[] {
    return [
      ...this._msgLogs["persistent"].msgs,
      ...this._msgLogs["temporary"].msgs
    ];
  }

  public add(
    type: MessageType,
    msg: Message | Message[]
  ) {
    const msgLog = this._msgLogs[type];
    let msgs = Array.isArray(msg) ? msg : [msg];

    for (const msg of msgs) {
      const tokens = this._tokenizer.encode(msg.content || "").length;

      // If the message is larger than the context window
      if (tokens > this._chunkTokens) {
        const chunked = this._chunk(msg);
        msgLog.tokens += chunked.tokens;
        msgLog.msgs.push(...chunked.msgs);
      } else {
        msgLog.tokens += tokens;
        msgLog.msgs.push(msg);
      }
    }

    // Save the full log to disk
    this._save();
  }

  public persistent(
    role: ChatCompletionRequestMessageRoleEnum,
    content: string
  ): string {
    this.add("persistent", { role, content });
    return content;
  }

  public temporary(
    role: ChatCompletionRequestMessageRoleEnum,
    content: string
  ): string | undefined;
  public temporary(
    msg: Message
  ): string | undefined;
  public temporary(
    roleOrMsg: ChatCompletionRequestMessageRoleEnum | Message,
    content?: string
  ): string | undefined {
    switch(typeof roleOrMsg) {
      case "string":
        this.add("temporary", { role: roleOrMsg as ChatCompletionRequestMessageRoleEnum, content });
        return content;
      case "object":
        this.add("temporary", roleOrMsg as Message);
        return roleOrMsg.content;
      default:
        throw new Error(`Invalid type for roleOrMsg: ${typeof roleOrMsg}`);
    }
  }

  public async fitToContextWindow(): Promise<void> {
    const msgLogs = this._msgLogs;
    const totalTokens = () =>
      msgLogs["persistent"].tokens +
      msgLogs["temporary"].tokens;

    if (totalTokens() < this._maxContextTokens) {
      return;
    }

    this._logger.error(`! Max Tokens Exceeded (${totalTokens()} / ${this._maxContextTokens})`);

    // Start with "temporary" messages
    await this._summarize("temporary");

    if (totalTokens() < this._maxContextTokens) {
      return;
    }

    // Move onto "persistent" messages
    await this._summarize("persistent");
  }

  private _chunk(msg: Message): MessageLog {
    const chunks: MessageLog = {
      tokens: 0,
      msgs: []
    };
    let content = msg.content || "";

    while (content.length > 0) {
      // Slice a chunk
      const contentChunk = content.slice(0, this._chunkTokens);

      // Append the chunk
      chunks.tokens += this._tokenizer.encode(contentChunk).length;
      chunks.msgs.push({
        ...msg,
        content: contentChunk
      });

      // Remove the chunk
      content = content.slice(this._chunkTokens);
    }

    return chunks;
  }

  private _save() {
    this._workspace.writeFileSync(
      this._msgsFile,
      JSON.stringify(this._msgLogs, null, 2)
    );
  }

  private async _summarize(
    msgType: MessageType
  ): Promise<void> {
    const msgLog = this._msgLogs[msgType];

    const message = await this._summarizeMessages(msgLog.msgs);

    if (!message) {
      return;
    }

    const tokens = this._tokenizer.encode(message.content || "").length;

    this._msgLogs[msgType] = {
      tokens,
      msgs: [message]
    };
  }

  private async _summarizeMessages(
    msgs: Message[]
  ): Promise<Message | undefined> {
    let result: Message | undefined;
    let queue = msgs;

    // While we still have more than 1 message to summarize
    while (queue.length > 1) {
      // Aggregate as many messages as possible,
      // based on max size of the context window
      const toSummarize: Message[] = [];
      let tokenCounter = 0;
      let index = 0;

      while (index < queue.length) {
        const msg = queue[index];
        const content = msg.content || "";
        const contentTokens = this._tokenizer.encode(content).length;

        if ((tokenCounter + contentTokens) > (this._maxContextTokens - this._summaryTokens)) {
          break;
        }

        toSummarize.push(msg);
        tokenCounter += this._tokenizer.encode(content).length;
        index++;
      }

      // Summarize
      const message = await this._llm.getResponse(
        this,
        [],
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

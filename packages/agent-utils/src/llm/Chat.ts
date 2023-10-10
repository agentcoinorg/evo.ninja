import {
  Tokenizer,
  ChatLogs,
  ChatMessage,
  ChatLogType,
  ContextWindow
} from ".";
import { AgentFunctionDefinition } from "../agent";
import { Logger } from "../sys";

import { ChatCompletionRequestMessageRoleEnum } from "openai";

export type ChatRole = ChatCompletionRequestMessageRoleEnum;

export class Chat {
  private _chatLogs: ChatLogs;

  constructor(
    private _tokenizer: Tokenizer,
    private _contextWindow?: ContextWindow,
    private _logger?: Logger,
  ) {
    this._chatLogs = new ChatLogs();
  }

  get chatLogs(): ChatLogs {
    return this._chatLogs;
  }

  get tokens(): number {
    return this._chatLogs.tokens;
  }

  get tokenizer(): Tokenizer {
    return this._tokenizer;
  }

  get contextWindow(): ContextWindow | undefined {
    return this._contextWindow;
  }

  get messages(): ChatMessage[] {
    return this._chatLogs.messages;
  }

  public add(
    type: ChatLogType,
    msg: ChatMessage | ChatMessage[]
  ) {
    let msgs = Array.isArray(msg) ? msg : [msg];

    for (const msg of msgs) {
      const tokens = this._tokenizer.encode(JSON.stringify(msg)).length;

      // If the message is larger than the context window
      if (this._contextWindow?.shouldChunk(tokens)) {
        const chunked = this._contextWindow.chunk(
          msg,
          this._tokenizer
        );
        this._chatLogs.add(type, chunked);
      } else {
        this._chatLogs.add(type, {
          tokens,
          msgs: [msg]
        });
      }
    }
  }

  public persistent(
    role: ChatRole,
    content: string
  ): string | undefined 
  public persistent(
    msg: ChatMessage
  ): string | undefined 
  public persistent(
    roleOrMsg: ChatRole | ChatMessage,
    content?: string
  ): string | undefined {
    switch(typeof roleOrMsg) {
      case "string": 
        this.add("persistent", { role: roleOrMsg as ChatRole, content });
        return content;
      case "object":
        this.add("persistent", roleOrMsg as ChatMessage);
        return roleOrMsg.content;
      default:
        throw new Error(`Invalid type for roleOrMsg: ${typeof roleOrMsg}`);
    }
  }

  public temporary(
    role: ChatRole,
    content?: string
  ): string | undefined;
  public temporary(
    msg: ChatMessage
  ): string | undefined;
  public temporary(
    roleOrMsg: ChatRole | ChatMessage,
    content?: string
  ): string | undefined {
    switch(typeof roleOrMsg) {
      case "string":
        this.add("temporary", { role: roleOrMsg as ChatRole, content });
        return content;
      case "object":
        this.add("temporary", roleOrMsg as ChatMessage);
        return roleOrMsg.content;
      default:
        throw new Error(`Invalid type for roleOrMsg: ${typeof roleOrMsg}`);
    }
  }

  public addFunction(fn: AgentFunctionDefinition): void {
    const tokens = this._tokenizer.encode(JSON.stringify(fn)).length;
    this._chatLogs.addFunction(fn, tokens);
  }

  public cloneChatLogs(): ChatLogs {
    return this._chatLogs.clone();
  }

  public toString(): string {
    return JSON.stringify(this, null, 2);
  }

  public toJSON(): ChatLogs {
    return this._chatLogs;
  }

  public async fitToContextWindow(): Promise<void> {
    if (!this._contextWindow) {
      return Promise.resolve();
    }

    if (!this._contextWindow.shouldSummarize(this.tokens)) {
      return Promise.resolve();
    }

    this._logger?.error(
      `! Max Tokens Exceeded (${
        this.tokens} / ${this._contextWindow.maxContextTokens
      })`
    );

    this._chatLogs = await this._contextWindow.summarizeChat(
      this._chatLogs,
      this._tokenizer
    );
  }
}

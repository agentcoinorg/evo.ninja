import {
  Tokenizer,
  ChatLogs,
  ChatMessage,
  ChatLogType,
} from "./";
import { FunctionDefinition } from "../";

import { ChatCompletionRequestMessageRoleEnum } from "openai";

export type ChatRole = ChatCompletionRequestMessageRoleEnum;

export class Chat {
  protected _chatLogs: ChatLogs;

  constructor(
    protected _tokenizer: Tokenizer,
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
      this._chatLogs.add(type, [msg], [tokens]);
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

  public addFunction(fn: FunctionDefinition): void {
    const tokens = this._tokenizer.encode(JSON.stringify(fn)).length;
    this._chatLogs.addFunction(fn, tokens);
  }

  public getLastMessage(type: ChatLogType): ChatMessage | undefined {
    const chatLog = this._chatLogs.get(type);
    if (chatLog.msgs.length < 1) {
      return undefined;
    }
    return chatLog.msgs[chatLog.msgs.length - 1];
  }

  public cloneChatLogs(): ChatLogs {
    return this._chatLogs.clone();
  }

  public cloneEmpty(): Chat {
    return new Chat(this.tokenizer);
  }

  public toString(): string {
    return JSON.stringify(this, null, 2);
  }

  public toJSON(): ChatLogs {
    return this._chatLogs;
  }
}

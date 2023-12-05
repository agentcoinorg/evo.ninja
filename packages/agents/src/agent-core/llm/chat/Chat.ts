import { Tokenizer, ChatLogs, ChatMessage, ChatLogType } from "./";
import { FunctionDefinition } from "../";
import { ChatCompletionRole } from "openai/resources";

export type ChatRole = ChatCompletionRole;

export class Chat {
  protected _chatLogs: ChatLogs;

  constructor(
    protected _tokenizer: Tokenizer,
    protected options?: {
      onMessagesAdded?: (msgs: ChatMessage[]) => Promise<void>
    }
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

  public async add(type: ChatLogType, msg: ChatMessage | ChatMessage[]): Promise<void> {
    const msgs = Array.isArray(msg) ? msg : [msg];

    const msgsWithTokens = msgs.map((msg) => {
      const tokens = this._tokenizer.encode(JSON.stringify(msg)).length;
      return { ...msg, tokens };
    })
    const tokens = msgsWithTokens.map(({ tokens }) => tokens);

    this._chatLogs.add(type, msgs, tokens)

    if (this.options?.onMessagesAdded) {
      await this.options.onMessagesAdded(msgs);
    }
  }

  public async persistent(role: ChatRole, content: string): Promise<void>;
  public async persistent(
    msg: ChatMessage
  ): Promise<void>;
  public async persistent(
    msgs: ChatMessage[]
  ): Promise<void>;
  public async persistent(
    roleOrMsg: ChatRole | ChatMessage | ChatMessage[],
    content?: string
  ): Promise<void> {
    switch (typeof roleOrMsg) {
      case "string":
        await this.add("persistent", {
          role: roleOrMsg as "system" | "user" | "assistant",
          content: content ?? null,
        });
        break;
      case "object":
        await this.add("persistent", roleOrMsg);
        break;
      default:
        throw new Error(`Invalid type for roleOrMsg: ${typeof roleOrMsg}`);
    }
  }

  public async temporary(
    role: ChatRole,
    content?: string
  ): Promise<void>;
  public async temporary(
    msg: ChatMessage
  ): Promise<void>;
  public async temporary(
    msgs: ChatMessage[]
  ): Promise<void>;
  public async temporary(
    roleOrMsg: ChatRole | ChatMessage | ChatMessage[],
    content?: string
  ): Promise<void> {
    switch(typeof roleOrMsg) {
      case "string":
        await this.add("temporary", { role: roleOrMsg as "system" | "user", content: content ?? null });
        break;
      case "object":
        await this.add("temporary", roleOrMsg as ChatMessage);
        break;
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

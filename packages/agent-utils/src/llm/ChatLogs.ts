import { ChatCompletionRequestMessage as ChatMessage } from "openai";

export { ChatMessage };

export type ChatLogType =
  | "persistent"
  | "temporary";

export interface ChatLog {
  tokens: number;
  msgs: ChatMessage[];
}

export class ChatLogs {
  private _logs: Record<ChatLogType, ChatLog> = {
    "persistent": {
      tokens: 0,
      msgs: [],
    },
    "temporary": {
      tokens: 0,
      msgs: [],
    },
  };

  constructor(logs?: Record<ChatLogType, ChatLog>) {
    if (logs) {
      this._logs = logs;
    }
  }

  get tokens(): number {
    return this._logs["persistent"].tokens +
      this._logs["temporary"].tokens;
  }

  get messages(): ChatMessage[] {
    return [
      ...this._logs["persistent"].msgs,
      ...this._logs["temporary"].msgs
    ];
  }

  static from(chatLog: ChatLog): ChatLogs {
    return new ChatLogs({
      "persistent": chatLog,
      "temporary": {
        tokens: 0,
        msgs: []
      }
    });
  }

  public get(type: ChatLogType): ChatLog {
    return this._logs[type];
  }

  public add(type: ChatLogType, log: ChatLog) {
    this._logs[type].tokens += log.tokens;
    this._logs[type].msgs.push(...log.msgs);
  }

  public clone(): ChatLogs {
    return new ChatLogs(
      JSON.parse(JSON.stringify(this._logs))
    );
  }

  public toString(): string {
    return JSON.stringify(this, null, 2);
  }

  public toJSON(): unknown {
    return this._logs;
  }
}

import { Timer } from "./Timer";

import { ChatLogs, ChatMessage } from "@evo-ninja/agent-utils";

export class DebugLlmReq {
  constructor(
    public time: Timer,
    public chatLogs: ChatLogs,
    public response?: ChatMessage
  ) { }

  get tokens(): number {
    return this.chatLogs.tokens;
  }

  toString(): string {
    return JSON.stringify(this.toJSON(), null, 2);
  }

  toJSON(): {
    time: Timer;
    tokens: number;
    response?: ChatMessage;
    chat: ChatLogs;
  } {
    return {
      time: this.time,
      tokens: this.tokens,
      response: this.response,
      chat: this.chatLogs,
    };
  }
}

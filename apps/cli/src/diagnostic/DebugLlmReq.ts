import { Timer } from "./Timer";

import { ChatLogs, ChatMessage } from "@evo-ninja/agent-utils";

export class DebugLlmReq {
  constructor(
    public time: Timer,
    public chatLogs: ChatLogs,
    public response?: ChatMessage
  ) { }

  get tokens() {
    return this.chatLogs.tokens;
  }

  toString(): string {
    return JSON.stringify(this.toJSON(), null, 2);
  }

  toJSON(): unknown {
    return {
      time: this.time,
      tokens: this.tokens,
      chat: this.chatLogs,
      response: this.response
    };
  }
}

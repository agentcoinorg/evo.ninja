import { Timer } from "./Timer";

import { ChatMessageLog, LlmResponse } from "@evo-ninja/agent-utils";

export class DebugLlmReq {
  constructor(
    public time: Timer,
    public chat: ChatMessageLog,
    public response?: LlmResponse
  ) { }

  get tokens() {
    return this.chat["persistent"].tokens +
      this.chat["temporary"].tokens;
  }

  toString(): string {
    return JSON.stringify(this.toJSON(), null, 2);
  }

  toJSON() {
    return {
      time: this.time,
      tokens: this.tokens,
      chat: this.chat,
      response: this.response
    };
  }
}

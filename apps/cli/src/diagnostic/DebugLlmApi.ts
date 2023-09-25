import { DebugLog } from "./DebugLog";
import { Timer } from "./Timer";

import { Chat, LlmApi, LlmOptions, ChatMessage } from "@evo-ninja/agent-utils";

export class DebugLlmApi implements LlmApi {
  constructor(
    public debugLog: DebugLog,
    public llm: LlmApi,
  ) { }

  getMaxContextTokens(): number {
    return this.llm.getMaxContextTokens();
  }

  getModel(): string {
    return this.llm.getModel();
  }

  async getResponse(
    chat: Chat,
    functionDefinitions: any[],
    options?: LlmOptions | undefined
  ): Promise<ChatMessage | undefined> {
    console.log(this.getModel());

    const time = new Timer();
    time.start();

    const resp = await this.llm.getResponse(
      chat,
      functionDefinitions,
      options
    );

    time.end();
    console.log("get response debug")
    console.log(this)
    this.debugLog.stepLlmReq(
      time,
      chat.export(),
      resp
    );

    return resp;
  }
}

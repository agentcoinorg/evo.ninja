import { DebugLog } from "./DebugLog";
import { Timer } from "./Timer";

import { LlmApi, LlmOptions, ChatLogs, ChatMessage } from "@evo-ninja/agent-utils";

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
    chatLogs: ChatLogs,
    functionDefinitions: any[],
    options?: LlmOptions | undefined
  ): Promise<ChatMessage | undefined> {
    console.log(this.getModel());

    const time = new Timer();
    time.start();

    const resp = await this.llm.getResponse(
      chatLogs,
      functionDefinitions,
      options
    );

    time.end();
    this.debugLog.stepLlmReq(
      time,
      chatLogs.clone(),
      resp
    );

    return resp;
  }
}

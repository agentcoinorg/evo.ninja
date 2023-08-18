import { Chat } from "./chat";

export declare const LlmRoles: {
  readonly System: "system";
  readonly User: "user";
  readonly Assistant: "assistant";
  readonly Function: "function";
};
export declare type LlmRole = typeof LlmRoles[keyof typeof LlmRoles];

export interface LlmResponse {
  role: LlmRole,
  content?: string;
  function_call?: {
    name?: string,
    arguments?: string
  };
}

export interface LlmApi {
  getResponse(chat: Chat, functionDefinitions: any[]): Promise<LlmResponse | undefined>;
}

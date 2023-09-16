import { Chat } from ".";

export declare const LlmRoles: {
  readonly System: "system";
  readonly User: "user";
  readonly Assistant: "assistant";
  readonly Function: "function";
};
export declare type LlmRole = typeof LlmRoles[keyof typeof LlmRoles];

export interface LlmOptions {
  temperature?: number;
  max_tokens?: number;
}

export interface LlmResponse {
  role: LlmRole,
  content?: string;
  function_call?: {
    name?: string,
    arguments?: string
  };
}

export interface LlmApi {
  getMaxContextTokens(): number;
  getModel(): string;
  getResponse(
    chat: Chat,
    functionDefinitions: any[],
    options?: LlmOptions
  ): Promise<LlmResponse | undefined>;
}

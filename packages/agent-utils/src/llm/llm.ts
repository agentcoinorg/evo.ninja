import { Chat, ChatMessage } from ".";

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

export interface LlmApi {
  getMaxContextTokens(): number;
  getModel(): string;
  getResponse(
    chat: Chat,
    functionDefinitions: any[],
    options?: LlmOptions
  ): Promise<ChatMessage | undefined>;
}

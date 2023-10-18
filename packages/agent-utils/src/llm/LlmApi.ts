import { ChatLogs, ChatMessage, OpenAIFunctions } from ".";

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
  getMaxResponseTokens(): number;
  getModel(): string;
  getResponse(
    chatLog: ChatLogs,
    functionDefinitions?: OpenAIFunctions,
    options?: LlmOptions
  ): Promise<ChatMessage | undefined>;
}

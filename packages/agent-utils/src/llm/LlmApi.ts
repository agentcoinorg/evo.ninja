import { ChatLogs, ChatMessage, FunctionDefinition } from ".";

export declare const LlmRoles: {
  readonly System: "system";
  readonly User: "user";
  readonly Assistant: "assistant";
  readonly Function: "function";
};
export declare type LlmRole = (typeof LlmRoles)[keyof typeof LlmRoles];

export declare const LlmModels: {
  readonly GPT3: "gpt-3.5-turbo-0613";
  readonly GPT3_16k: "gpt-3.5-turbo-16k-0613";
  readonly GPT4: "gpt-4-0613";
};
export declare type LlmModel = (typeof LlmModels)[keyof typeof LlmModels];

export interface LlmOptions {
  temperature?: number;
  max_tokens?: number;
  model?: LlmModel;
}

export interface LlmApi {
  getMaxContextTokens(): number;
  getMaxResponseTokens(): number;
  getModel(): string;
  getResponse(
    chatLog: ChatLogs,
    functionDefinitions?: FunctionDefinition[],
    options?: LlmOptions
  ): Promise<ChatMessage | undefined>;
}

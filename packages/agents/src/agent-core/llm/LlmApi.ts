import { ChatCompletionMessage } from "openai/resources";
import { ChatLogs, FunctionDefinition } from ".";

export declare const LlmRoles: {
  readonly System: "system";
  readonly User: "user";
  readonly Assistant: "assistant";
  readonly Function: "function";
};
export declare type LlmRole = typeof LlmRoles[keyof typeof LlmRoles];

export declare const LlmModels: {
  readonly GPT3: "gpt-3.5-turbo-1106";
  readonly GPT3_16k: "gpt-3.5-turbo-16k";
  readonly GPT4: "gpt-4";
  readonly GPT4_32k: "gpt-4-32k";
  readonly GPT4_TURBO: "gpt-4-1106-preview"
};
export declare type LlmModel = typeof LlmModels[keyof typeof LlmModels];

export interface LlmOptions {
  model?: LlmModel;
}

export interface LlmApi {
  getModel(): string;
  getResponse(
    chatLog: ChatLogs,
    functionDefinitions?: FunctionDefinition[],
    options?: LlmOptions
  ): Promise<ChatCompletionMessage | undefined>;
}

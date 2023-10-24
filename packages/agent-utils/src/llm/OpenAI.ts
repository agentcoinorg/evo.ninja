import { LlmApi, LlmOptions, ChatLogs, ChatMessage } from ".";
import { Logger } from "../";

import {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
  ChatCompletionRequestMessageFunctionCall,
  Configuration,
  OpenAIApi,
  ChatCompletionFunctions,
} from "openai";
import { cleanOpenAIError } from "../utils/openai";

export {
  ChatCompletionResponseMessage as OpenAIResponse,
  ChatCompletionRequestMessageFunctionCall as OpenAIFunctionCall
};

interface OpenAIError {
  status: number;
  message: string;
  data: unknown;
}

export type FunctionDefinition = ChatCompletionFunctions;

export class OpenAI implements LlmApi {
  private _configuration: Configuration;
  private _api: OpenAIApi;

  constructor(
    private _apiKey: string,
    private _defaultModel: string,
    private _defaultMaxTokens: number,
    private _defaultMaxResponseTokens: number,
    private _logger: Logger,
    private _maxRateLimitRetries: number = 5
  ) {
    this._configuration = new Configuration({
    apiKey: this._apiKey
    });
    this._api = new OpenAIApi(this._configuration);
  }

  getMaxContextTokens() {
    return this._defaultMaxTokens;
  }

  getMaxResponseTokens() {
    return this._defaultMaxResponseTokens;
  }

  getModel() {
    return this._defaultModel;
  }

  async getResponse(
    chatLog: ChatLogs,
    functionDefinitions?: FunctionDefinition[],
    options?: LlmOptions,
    tries?: number
  ): Promise<ChatMessage | undefined> {
    try {
      const completion = await this._createChatCompletion({
        messages: chatLog.messages,
        functions: functionDefinitions,
        temperature: options ? options.temperature : 0,
        max_tokens: options ? options.max_tokens : this._defaultMaxResponseTokens,
        model: options ? options.model : this._defaultModel
      });

      if (completion.data.choices.length < 1) {
        throw Error("Chat completion choices length was 0...");
      }

      const choice = completion.data.choices[0];

      if (!choice.message) {
        throw Error(
          `Chat completion message was undefined: ${JSON.stringify(choice, null, 2)}`
        );
      }

      return choice.message;
    } catch (err) {
      const error = cleanOpenAIError(err);

      // Special handling
      if (typeof error === "object") {
        const maybeOpenAiError = error as Partial<OpenAIError>;

        // If a rate limit error is thrown
        if (maybeOpenAiError.status === 429) {
          this._logger.warning("Warning: OpenAI rate limit exceeded, sleeping for 15 seconds.");

          // Try again after a short sleep
          await new Promise((resolve) => setTimeout(resolve, 15000));

          if (!tries || tries < this._maxRateLimitRetries) {
            return this.getResponse(
              chatLog,
              functionDefinitions,
              options,
              tries === undefined ? 0 : ++tries
            );
          }
        }
      }

      throw new Error(JSON.stringify(error, null, 2));
    }
  }

  private _createChatCompletion(options: {
    messages: ChatCompletionRequestMessage[];
    model?: string;
    functions?: FunctionDefinition[];
  } & LlmOptions) {
    return this._api.createChatCompletion({
      messages: options.messages,
      model: options.model || this._defaultModel,
      functions: options.functions,
      function_call: options.functions ? "auto" : undefined,
      temperature: options.temperature || 0,
      max_tokens: options.max_tokens
    });
  }
}

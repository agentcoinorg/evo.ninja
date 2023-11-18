import { LlmApi, LlmOptions, ChatLogs, LlmModel } from ".";
import { cleanOpenAIError } from "../utils/openai";

import OpenAIApi from "openai";
import { Logger } from "@evo-ninja/agent-utils";
import { ChatCompletionMessage, ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources";

interface OpenAIError {
  status: number;
  message: string;
  data: unknown;
}

export type FunctionDefinition = ChatCompletionTool.Function;

export class OpenAIChatCompletion implements LlmApi {
  private _api: OpenAIApi;

  constructor(
    private _apiKey: string,
    private _defaultModel: LlmModel,
    private _defaultMaxTokens: number,
    private _defaultMaxResponseTokens: number,
    private _logger: Logger,
    private _maxRateLimitRetries: number = 5
  ) {
    this._api = new OpenAIApi({
      apiKey: this._apiKey,
      dangerouslyAllowBrowser: true
    });
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
    messages: { role: string; content: string | null }[],
    functionDefinitions?: FunctionDefinition[],
    options?: LlmOptions,
    tries?: number,
    temperature?: number,
    max_tokens?: number
  ): Promise<ChatCompletionMessage | undefined> {
    try {
      const completion = await this._createChatCompletion({
        messages: messages as ChatCompletionMessageParam[],
        functions: functionDefinitions,
        temperature: temperature ?? 0,
        max_tokens: max_tokens ?? this._defaultMaxResponseTokens,
        model: options?.model ?? this._defaultModel
      });

      if (completion.choices.length < 1) {
        throw Error("Chat completion choices length was 0...");
      }

      const choice = completion.choices[0];

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
              messages,
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
    messages: ChatCompletionMessageParam[],
    model?: LlmModel;
    functions?: FunctionDefinition[];
  } & LlmOptions & { temperature?: number, max_tokens?: number }) {
    return this._api.chat.completions.create({
      messages: options.messages,
      model: options.model || this._defaultModel,
      functions: options.functions,
      function_call: options.functions ? "auto" : undefined,
      temperature: options.temperature || 0,
      max_tokens: options.max_tokens
    });
  }
}

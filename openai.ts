import {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
  ChatCompletionRequestMessageFunctionCall,
  Configuration,
  OpenAIApi
} from "openai";
import { Chat } from "./chat";
import { env } from ".";
import { LlmApi, LlmResponse } from "./llm";
export {
  ChatCompletionResponseMessage as OpenAIResponse,
  ChatCompletionRequestMessageFunctionCall as OpenAIFunctionCall
};

export class OpenAI implements LlmApi {
  private _configuration: Configuration;
  private _api: OpenAIApi;

  constructor(
    private _apiKey: string,
    private _defaultModel: string
  ) {
    this._configuration = new Configuration({
    apiKey: this._apiKey
    });
    this._api = new OpenAIApi(this._configuration);
  }

  async getResponse(chat: Chat, functionDefinitions: any[]): Promise<LlmResponse | undefined> {
    const completion = await this.createChatCompletion({
    messages: chat.messages,
    functions: functionDefinitions,
    temperature: 0,
    max_tokens: env().MAX_TOKENS_PER_RESPONSE
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
  }

  private createChatCompletion(options: {
    messages: ChatCompletionRequestMessage[];
    model?: string;
    functions?: any;
    temperature?: number
    max_tokens?: number
  }) {
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
  
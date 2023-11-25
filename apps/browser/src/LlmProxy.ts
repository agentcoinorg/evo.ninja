import { ChatLogs, LlmApi, LlmOptions } from "@evo-ninja/agents";
import { ChatCompletionMessage, ChatCompletionTool } from "openai/resources";

export class LlmProxy implements LlmApi {
  private MAX_RATE_LIMIT_RETRIES = 5;
  constructor(
    private _defaultModel: string,
    private _defaultMaxTokens: number,
    private _defaultMaxResponseTokens: number
  ) {}

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
    functionDefinitions?: ChatCompletionTool.Function[] | undefined,
    _?: LlmOptions | undefined,
    tries?: number
  ): Promise<ChatCompletionMessage | undefined> {
    const llmResponse = await fetch("/api/proxy/llm", {
      method: "POST",
      body: JSON.stringify({
        messages: chatLog.messages,
        functions: functionDefinitions,
        options: {
          temperature: 0,
          maxTokens: this._defaultMaxResponseTokens,
          model: this._defaultModel,
        },
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!llmResponse.ok) {
      if (llmResponse.status === 400) {
        const error = await llmResponse.json();
        throw Error("Error from OpenAI Chat completion: " + error.error);
      }
      if (llmResponse.status === 429) {
        await new Promise((resolve) => setTimeout(resolve, 15000));
        if (!tries || tries < this.MAX_RATE_LIMIT_RETRIES) {
          return this.getResponse(
            chatLog,
            functionDefinitions,
            undefined,
            tries == undefined ? 0 : ++tries
          );
        }
      }
      throw Error("Error trying to get response from LLM");
    }
    const { message } = await llmResponse.json();
    return message;
  }
}

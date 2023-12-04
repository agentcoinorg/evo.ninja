import { ChatLogs, LlmApi, LlmOptions } from "@evo-ninja/agents";
import { ChatCompletionMessage, ChatCompletionTool } from "openai/resources";
import { ERROR_SUBSIDY_MAX } from "./errors";

const MAX_RATE_LIMIT_RETRIES = 5;

export class ProxyLlmApi implements LlmApi {

  private _goalId: string | undefined = undefined;

  constructor(
    private _defaultModel: string,
    private _defaultMaxTokens: number,
    private _defaultMaxResponseTokens: number,
    private _setCapReached: () => void
  ) {}

  public setGoalId(goalId: string | undefined) {
    this._goalId = goalId;
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
    functionDefinitions?: ChatCompletionTool.Function[] | undefined,
    options?: LlmOptions,
    tries?: number
  ): Promise<ChatCompletionMessage | undefined> {
    const goalId = this._goalId;
    if (!goalId) {
      throw Error("GoalID is not set");
    }

    const response = await fetch("/api/proxy/completions", {
      method: "POST",
      body: JSON.stringify({
        messages: chatLog.messages,
        functions: functionDefinitions,
        options: {
          temperature: options?.temperature || 0,
          maxTokens: options?.max_tokens || this._defaultMaxResponseTokens,
          model: options?.model || this._defaultModel,
        },
        goalId
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 400) {
        throw Error("Error from OpenAI Chat Completions: " + error.error);
      }
      if (response.status === 429) {
        await new Promise((resolve) => setTimeout(resolve, 15000));
        if (!tries || tries < MAX_RATE_LIMIT_RETRIES) {
          return this.getResponse(
            chatLog,
            functionDefinitions,
            undefined,
            tries == undefined ? 1 : tries + 1
          );
        }
      }
      if (response.status === 403) {
        this._setCapReached();
        throw Error(ERROR_SUBSIDY_MAX);
      }
      throw Error("Error trying to get response from completions proxy.", error);
    }
    const { message } = await response.json();
    return message;
  }
}

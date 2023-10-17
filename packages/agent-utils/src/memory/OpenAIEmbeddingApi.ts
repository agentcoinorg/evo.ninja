import { Configuration, OpenAIApi } from "openai";
import { EmbeddingApi, EmbeddingCreationResult } from "./EmbeddingApi";
import { Logger } from "../sys";
import { OpenAIError, cleanOpenAIError } from "../utils/openai";

export class OpenAIEmbeddingAPI implements EmbeddingApi {
  private configuration: Configuration;
  private api: OpenAIApi;
  
  constructor(
    private apiKey: string,
    private model: string,
    private logger: Logger,
    private _maxRateLimitRetries: number = 5
  ) {
    this.configuration = new Configuration({
      apiKey: this.apiKey
      });
    this.api = new OpenAIApi(this.configuration);
  }

  async createEmbedding(text: string, tries?: number): Promise<EmbeddingCreationResult> {
    try {
      const { data } = await this.api.createEmbedding({
        model: this.model,
        input: text
      })
  
      return {
        embedding: data.data[0].embedding,
        model: data.model,
        promptTokensUsed: data.usage.prompt_tokens,
        totalTokensUsed: data.usage.total_tokens
      }
    } catch (err) {
      const error = cleanOpenAIError(err);

      if (typeof error === "object") {
        const maybeOpenAiError = error as Partial<OpenAIError>;

        if (maybeOpenAiError.status === 429) {
          this.logger.warning("Warning: OpenAI rate limit exceeded, sleeping for 15 seconds.");

          await new Promise((resolve) => setTimeout(resolve, 15000));

          if (!tries || tries < this._maxRateLimitRetries) {
            return this.createEmbedding(
              text,
              tries === undefined ? 0 : ++tries
            );
          }
        }
      }

      throw new Error(JSON.stringify(error, null, 2));
    }
  };
}
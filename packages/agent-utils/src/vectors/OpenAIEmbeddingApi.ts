import { Configuration, OpenAIApi } from "openai";
import { EmbeddingApi, EmbeddingCreationResult } from "./EmbeddingApi";
import { ILogger } from "../sys";
import { OpenAIError, cleanOpenAIError } from "../utils/openai";
import { Tokenizer } from "../llm";
import { splitArray } from "./utils";

export const DEFAULT_ADA_CONFIG = {
  model: "text-embedding-ada-002",
  maxTokensPerInput: 8191,
  maxInputsPerRequest: 2048
}

export class OpenAIEmbeddingAPI implements EmbeddingApi {
  private configuration: Configuration;
  private api: OpenAIApi;
  
  constructor(
    private apiKey: string,
    private logger: ILogger,
    private tokenizer: Tokenizer,
    private modelConfig: {
      model: string,
      maxTokensPerInput: number,
      maxInputsPerRequest: number
    } = DEFAULT_ADA_CONFIG,
    private _maxRateLimitRetries: number = 5
  ) {
    this.configuration = new Configuration({
      apiKey: this.apiKey
    });
    this.api = new OpenAIApi(this.configuration);
  }

  async createEmbeddings(input: string | string[], tries?: number): Promise<EmbeddingCreationResult> {
    try {
      const inputs = Array.isArray(input) ? input : [input];
      this.validateInput(inputs);

      const batchedInputs = splitArray(inputs, this.modelConfig.maxInputsPerRequest);

      console.log("batchedInputs", batchedInputs);
      const tokens = batchedInputs.map(inputs => inputs.map(input => this.tokenizer.encode(input)));
      const totalTokens = tokens.reduce((acc, curr) => acc + curr.length, 0);
      console.log("totalTokens", totalTokens);

      const { data } = await this.api.createEmbedding({
        model: this.modelConfig.model,
        input: batchedInputs
      })
  
      return {
        embeddings: data.data,
        model: data.model,
        promptTokensUsed: data.usage.prompt_tokens,
        totalTokensUsed: data.usage.total_tokens
      }
    } catch (err) {
      const error = cleanOpenAIError(err);

      if (typeof error === "object") {
        const maybeOpenAiError = error as Partial<OpenAIError>;

        if (maybeOpenAiError.status === 429) {
          this.logger.warning("Warning: OpenAI rate limit exceeded, sleeping for 60 seconds.");

          await new Promise((resolve) => setTimeout(resolve, 60000));

          if (!tries || tries < this._maxRateLimitRetries) {
            return this.createEmbeddings(
              input,
              tries === undefined ? 0 : ++tries
            );
          }
        }
      }

      throw new Error(JSON.stringify(error, null, 2));
    }
  };

  validateInput(inputs: string[]) {
    for (const input of inputs) {
      if (this.tokenizer.encode(input).length > this.modelConfig.maxTokensPerInput) {
        throw new Error(`Input exceeds max request tokens: ${this.modelConfig.maxTokensPerInput}`);
      }
    }
  }
}
import { EmbeddingApi, EmbeddingCreationResult } from "./EmbeddingApi";
import { ILogger } from "../sys";
import { OpenAIError, cleanOpenAIError } from "../utils/openai";
import { Tokenizer } from "../llm";
import { splitArray } from "./utils";

import { Configuration, OpenAIApi } from "openai";

export const DEFAULT_ADA_CONFIG = {
  model: "text-embedding-ada-002",
  maxTokensPerInput: 8191,
  maxInputsPerRequest: 2048,
};

export class OpenAIEmbeddingAPI implements EmbeddingApi {
  private configuration: Configuration;
  private api: OpenAIApi;

  constructor(
    private apiKey: string,
    private logger: ILogger,
    private tokenizer: Tokenizer,
    private modelConfig: {
      model: string;
      maxTokensPerInput: number;
      maxInputsPerRequest: number;
    } = DEFAULT_ADA_CONFIG,
    private _maxRateLimitRetries: number = 5
  ) {
    this.configuration = new Configuration({
      apiKey: this.apiKey,
    });
    this.api = new OpenAIApi(this.configuration);
  }

  async createEmbeddings(
    input: string | string[],
    tries?: number
  ): Promise<EmbeddingCreationResult[]> {
    try {
      const inputs = Array.isArray(input) ? input : [input];
      this.validateInput(inputs);

      const batchedInputs = splitArray(
        inputs,
        this.modelConfig.maxInputsPerRequest
      );

      const results = await Promise.all(
        batchedInputs.map(async (inputs) => {
          const { data } = await this.api.createEmbedding({
            model: this.modelConfig.model,
            input: inputs,
          });

          return data.data.map((innerData) => {
            return {
              embedding: innerData.embedding,
              input: inputs[innerData.index],
            };
          });
        })
      );

      return results.flat();
    } catch (err) {
      const error = cleanOpenAIError(err);

      if (typeof error === "object") {
        const maybeOpenAiError = error as Partial<OpenAIError>;

        if (maybeOpenAiError.status === 429) {
          this.logger.warning(
            "Warning: OpenAI rate limit exceeded, sleeping for 15 seconds."
          );

          await new Promise((resolve) => setTimeout(resolve, 15000));

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
  }

  validateInput(inputs: string[]) {
    for (const input of inputs) {
      if (
        this.tokenizer.encode(input).length > this.modelConfig.maxTokensPerInput
      ) {
        throw new Error(
          `Input exceeds max request tokens: ${this.modelConfig.maxTokensPerInput}`
        );
      }
    }
  }
}

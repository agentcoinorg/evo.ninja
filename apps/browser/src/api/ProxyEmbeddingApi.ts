import {
  EmbeddingApi,
  EmbeddingCreationResult,
  Tokenizer,
  splitArray,
} from "@evo-ninja/agents";
import { DEFAULT_ADA_CONFIG } from "@evo-ninja/agents";
import { ERROR_SUBSIDY_MAX } from "./errors";

const MAX_RATE_LIMIT_RETRIES = 5;

export class ProxyEmbeddingApi implements EmbeddingApi {
  private _goalId: string | undefined = undefined;

  constructor(
    private tokenizer: Tokenizer,
    private _setCapReached: () => void,
    private modelConfig: {
      model: string;
      maxTokensPerInput: number;
      maxInputsPerRequest: number;
    } = DEFAULT_ADA_CONFIG
  ) {}

  public setGoalId(goalId: string | undefined) {
    this._goalId = goalId;
  }

  public async createEmbeddings(
    input: string | string[],
    tries?: number
  ): Promise<EmbeddingCreationResult[]> {
    const goalId = this._goalId;
    if (!goalId) {
      throw Error("GoalID is not set");
    }

    const inputs = Array.isArray(input) ? input : [input];
    this.validateInput(inputs);

    const batchedInputs = splitArray(
      inputs,
      this.modelConfig.maxInputsPerRequest
    );

    // here we guarantee that the strings of array has the expected size (or token limit)

    const results = await Promise.all(
      batchedInputs.map(async (input) => {
        let bytes = 0;
        input.forEach((i) => (bytes += i.length));
        console.log("TOTAL byte sfrom proxy embedding api", bytes);
        if (bytes >= 1_000_000) {
          console.log("this is the input to proxy embeddings");
          console.log(input);
        }
        const embeddingResponse = await fetch("/api/proxy/embeddings", {
          method: "POST",
          body: JSON.stringify({
            input: input,
            model: this.modelConfig.model,
            goalId,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log("after");

        if (!embeddingResponse.ok) {
          console.log("Error in proxy embedding api");
          console.log(embeddingResponse);
          const error = await embeddingResponse.json();
          if (embeddingResponse.status === 400) {
            throw Error("Error from OpenAI Embeddings: " + error.error);
          }
          if (embeddingResponse.status === 429) {
            await new Promise((resolve) => setTimeout(resolve, 15000));
            if (!tries || tries < MAX_RATE_LIMIT_RETRIES) {
              return this.createEmbeddings(
                input,
                tries == undefined ? 0 : ++tries
              );
            }
          }
          if (embeddingResponse.status === 403) {
            this._setCapReached();
            throw Error(ERROR_SUBSIDY_MAX);
          }
          throw Error(
            "Error trying to get response from embeddings proxy.",
            error
          );
        }

        const { embeddings } = await embeddingResponse.json();
        return embeddings;
      })
    );

    return results.flat();
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

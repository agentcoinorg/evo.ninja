import {
  Agent,
  AgentFunctionResult,
  AgentOutputType,
  AgentVariables,
  ChatMessageBuilder,
  Chunker,
  Vectorizer,
  trimText,
} from "@evo-ninja/agent-utils";
import axios from "axios";
import { v4 as uuid } from "forked-agent-protocol";
import { AgentFunctionBase } from "../AgentFunctionBase";
import { FUNCTION_CALL_FAILED, FUNCTION_CALL_SUCCESS_CONTENT } from "../agents/Scripter/utils";
import { AgentBaseContext } from "../AgentBase";
import { OpenAIApi } from "openai";

interface SearchInPagesFuncParameters {
  query: string;
  urls: string[];
}

export class SearchInPagesFunction extends AgentFunctionBase<SearchInPagesFuncParameters> {
  constructor(
    private chunker: Chunker,
    private vectorizer: Vectorizer,
    private openAIApi: OpenAIApi
  ) {
    super();
  }

  get name(): string {
    return "search_in_pages";
  }
  get description(): string {
    return `Searches across different specific web page URLs for a given query.`;
  }
  get parameters() {
    return {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Query to search the pages for",
        },
        urls: {
          type: "array",
          items: {
            type: "string",
          },
          description: "URLs of the pages to search for the query",
        },
      },
      required: ["string", "urls"],
      additionalProperties: false,
    };
  }

  buildExecutor(
    _: Agent<unknown>,
    context: AgentBaseContext
  ): (
    params: SearchInPagesFuncParameters,
    rawParams?: string
  ) => Promise<AgentFunctionResult> {
    return async (
      params: SearchInPagesFuncParameters,
      rawParams?: string
    ): Promise<AgentFunctionResult> => {
      try {
        const embeddingsMap = new Map<string, number[]>();
        const chunksMap = new Map<string, string>();

        for await (const url of params.urls) {
          try {
            const response = await this.processWebpage(url);
            const 
          } catch(e) {
            console.log(`Failed to fetch ${url}`)
          }
        }

        const batches = this.splitArrayIntoBatches(chunks, 200);

        for await (const batch of batches) {
          console.log(`Processing batch of ${batch.length} chunks`)
          await Promise.all(
            batch.map(async (chunk) => {
              const result = await this.vectorizer.createEmbedding(chunk);
              const id = uuid();
              embeddingsMap.set(id, result.data[0].embedding);
              chunksMap.set(id, chunk);
            })
          );
        }

        const queryEmbeddingResponse = await this.vectorizer.createEmbedding(
          params.query
        );
        const queryEmbedding = queryEmbeddingResponse.data[0].embedding;

        const embeddingSimilarityScores = Array.from(embeddingsMap.entries())
          .map(([id, embedding]) => {
            const similarityScore = this.vectorizer.cosineSimilarity(
              queryEmbedding,
              embedding
            );
            return { id, similarityScore };
          })
          .sort((a, b) => b.similarityScore - a.similarityScore);

        const sortedChunks = embeddingSimilarityScores
          .map((score) => score.id)
          .map((id) => chunksMap.get(id) as string);

        console.log(sortedChunks.slice(0, 5))
        
        const topChunks = this.limitChunksByCharacterCount(sortedChunks, 12000);

        const completion = await this.openAIApi.createChatCompletion({
          messages: [
            {
              role: "user",
              content: `I will give you chunks of text from different webpages. 
              I want to extract ${
                params.query
              } from them. Keep in mind some information may not be properly formatted.
              Do your best to extract as much information as you can.

              Prioritize accuracy. Do not settle for the first piece of information found if there are more precise results available
              Example: "population of New York in 2020" and you get the following results: ["1.5 million",  "nearly 1.600.000", "1,611,989"], you will take "1,611,989"
              
              Chunks: ${JSON.stringify(topChunks)}.
              Specify if the information is incomplete but still return it`,
            },
          ],
          model: "gpt-3.5-turbo-16k",
          temperature: 0,
        });

        const llmResponse = completion.data.choices[0].message
          ?.content as string;

        return this.onSuccess(
          params,
          llmResponse,
          rawParams,
          context.variables
        );
      } catch (err) {
        return this.onError(
          params,
          err.toString(),
          rawParams,
          context.variables
        );
      }
    };
  }

  private onSuccess(
    params: SearchInPagesFuncParameters,
    result: string,
    rawParams: string | undefined,
    variables: AgentVariables
  ): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `Search in '[${params.urls.join(", ")}]' for '${params.query}'`,
          content: FUNCTION_CALL_SUCCESS_CONTENT(
            this.name,
            params,
            `Found the following results for the search: '${params.query}'` +
              `\n--------------\n` +
              `${result}\n` +
              `\n--------------\n`
          ),
        },
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ChatMessageBuilder.functionCallResult(
          this.name,
          `Found the following result for the search: '${params.query}'` +
            `${result}\n` +
            `\`\`\``,
          variables
        ),
      ],
    };
  }

  private onError(
    params: SearchInPagesFuncParameters,
    error: string,
    rawParams: string | undefined,
    variables: AgentVariables
  ) {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `Search in '[${params.urls.join(", ")}]' for '${params.query}'`,
          content: FUNCTION_CALL_FAILED(
            params,
            this.name,
            error
          ),
        },
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ChatMessageBuilder.functionCallResult(
          this.name,
          `Error searching in pages for '${params.query}'\n` + 
          `\`\`\`\n` +
          `${trimText(error, 300)}\n` +
          `\`\`\``,
          variables
        ),
      ],
    };
  }

  private fetchHTML(url: string) {
    return axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64; rv:107.0) Gecko/20100101 Firefox/107.0",
      },
    });
  }

  private limitChunksByCharacterCount(
    chunks: string[],
    maxCharacters: number
  ): string[] {
    const result: string[] = [];

    chunks.forEach((chunk) => {
      const resultCharactersCount = result.join("").length;
      const charactersLeft = maxCharacters - resultCharactersCount;

      if (charactersLeft <= 0) {
        return;
      }

      if (chunk.length <= charactersLeft) {
        result.push(chunk);
        return;
      }

      result.push(chunk.substring(0, charactersLeft));
    });

    return result;
  }

  private splitArrayIntoBatches<T>(arr: T[], batchSize: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += batchSize) {
        const chunk = arr.slice(i, i + batchSize);
        result.push(chunk);
    }

    return result;
  }

  private async processWebpage(url: string) {
    console.log(`Fetching ${url}`)
    const response = await this.fetchHTML(url);
    console.log(`Fetched ${url}`)
    const html = response.data;
    const chunks = this.chunker.chunk(html);
    return chunks;
  }
}

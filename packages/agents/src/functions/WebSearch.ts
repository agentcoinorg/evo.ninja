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

interface WebSearchFuncParameters {
  query: string;
}

export class WebSearchFunction extends AgentFunctionBase<WebSearchFuncParameters> {
  constructor(
    private chunker: Chunker,
    private vectorizer: Vectorizer,
    private openAIApi: OpenAIApi
  ) {
    super();
  }

  get name(): string {
    return "web_search";
  }
  get description(): string {
    return `Searches the web for a given query.`;
  }
  get parameters() {
    return {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Query to search the web for",
        },
      },
      required: ["query"],
      additionalProperties: false,
    };
  }

  buildExecutor(
    _: Agent<unknown>,
    context: AgentBaseContext
  ): (
    params: WebSearchFuncParameters,
    rawParams?: string
  ) => Promise<AgentFunctionResult> {
    return async (
      params: WebSearchFuncParameters,
      rawParams?: string
    ): Promise<AgentFunctionResult> => {
      try {
        const embeddingsMap = new Map<string, number[]>();
        const chunksMap = new Map<string, string>();

        if (!context.env.SERP_API_KEY) {
          throw new Error(
            "SERP_API_KEY environment variable is required to use the websearch plugin. See env.template for help"
          );
        }

        const googleResults = await this.searchOnGoogle(
          params.query,
          context.env.SERP_API_KEY
        );
        const websitesToChunk = googleResults.map((result) => result.url);

        const chunks = (
          await Promise.all(
            websitesToChunk.map(async (url) => {
              const response = await this.fetchHTML(url);
              const html = response.data;
              return this.chunker.chunk(html);
            })
          )
        ).flat();

        await Promise.all(
          chunks.map(async (chunk) => {
            const result = await this.vectorizer.createEmbedding(chunk);
            const id = uuid();
            embeddingsMap.set(id, result.data[0].embedding);
            chunksMap.set(id, chunk);
          })
        );

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
        const topChunks = this.limitChunksByCharacterCount(sortedChunks, 10000);

        const completion = await this.openAIApi.createChatCompletion({
          messages: [
            {
              role: "user",
              content: `I will give you chunks of text from different webpages. 
              I want to extract ${
                params.query
              } from them. Keep in mind some information may not be properly formatted.
              Do your best to extract as much information as you can.
              
              Chunks: ${JSON.stringify(topChunks)}.
              Specify if the information is incomplete but still return it`,
            },
          ],
          model: "gpt-4",
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
    params: WebSearchFuncParameters,
    result: string,
    rawParams: string | undefined,
    variables: AgentVariables
  ): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `Web search for '${params.query}'`,
          content: FUNCTION_CALL_SUCCESS_CONTENT(
            this.name,
            params,
            `Found the following result for the web search: '${params.query}'` +
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
          `Found the following result for the web search: '${params.query}'` +
            `${result}\n` +
            `\`\`\``,
          variables
        ),
      ],
    };
  }

  private onError(
    params: WebSearchFuncParameters,
    error: string,
    rawParams: string | undefined,
    variables: AgentVariables
  ) {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `Web search for '${params.query}'`,
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
          `Error web searching for '${params.query}'\n` + 
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

  private async searchOnGoogle(query: string, apiKey: string, maxResults = 4) {
    const axiosClient = axios.create({
      baseURL: "https://serpapi.com",
    });

    const searchQuery = encodeURI(query);
    const urlParams = new URLSearchParams({
      engine: "google",
      q: searchQuery,
      location_requested: "United States",
      location_used: "United States",
      google_domain: "google.com",
      hl: "en",
      gl: "us",
      device: "desktop",
      api_key: apiKey,
    });

    const { data } = await axiosClient.get<{
      organic_results: {
        title: string;
        link: string;
        snippet: string;
        snippet_highlighted_words: string[];
      }[];
    }>(`/search?${urlParams.toString()}`, {
      headers: {
        Accept: "application/json",
      },
    });

    const result = data.organic_results
      .map((result) => ({
        title: result.title ?? "",
        url: result.link ?? "",
        description: result.snippet ?? "",
      }))
      .slice(0, maxResults);

    return result;
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
}

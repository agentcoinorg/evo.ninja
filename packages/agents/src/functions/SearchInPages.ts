import {
  Agent,
  AgentFunctionResult,
  AgentOutputType,
  AgentVariables,
  ChatMessageBuilder,
  Chunker,
  LlmApi,
  Tokenizer,
  trimText,
} from "@evo-ninja/agent-utils";
import axios from "axios";
import { v4 as uuid } from "agent-protocol";
import { FUNCTION_CALL_FAILED, FUNCTION_CALL_SUCCESS_CONTENT } from "../agents/Scripter/utils";
import { AgentBaseContext } from "../AgentBase";
import { Connection, EmbeddingFunction } from "vectordb";
import { LlmAgentFunctionBase } from "../LlmAgentFunctionBase";

interface SearchInPagesFuncParameters {
  query: string;
  urls: string[];
}

const MAX_RESULTS_TOKENS = 6000
const SEARCH_RESULTS_LIMIT = 25
const FETCH_WEBPAGE_TIMEOUT = 8000

export class SearchInPagesFunction extends LlmAgentFunctionBase<SearchInPagesFuncParameters> {
  constructor(
    private chunker: Chunker,
    tokenizer: Tokenizer,
    llm: LlmApi,
    private lanceDb: {
      connect: () => Promise<Connection>,
      embeddingFunction: (columnName: string) => EmbeddingFunction<string>
    }
  ) {
    super(llm, tokenizer);
  }

  name: string = "search_in_pages";
  description: string = `Searches across different specific web page URLs for a given query.`;
  parameters: any = {
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
    required: ["query", "urls"],
    additionalProperties: false,
  };

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
        const connection = await this.lanceDb.connect()
        const table = await connection.createTable({
          name: uuid(),
          embeddingFunction: this.lanceDb.embeddingFunction("text"),
          data: [{
            text: " ",
            id: uuid()
          }]
        })

        for await (const url of params.urls) {
          try {
            const response = await this.processWebpage(url);
            const data = response.map((chunk) => ({
              text: chunk,
              id: uuid(),
            }))
            await table.add(data)
          } catch(e) {
            context.logger.error(`Failed to process ${url}`)
          }
        }

        const results = await table
          .search(params.query)
          .limit(SEARCH_RESULTS_LIMIT)
          .execute()

        const resultsText = results.map((result) => result.text as string)
        const limitedResults = this.limitResults(resultsText, MAX_RESULTS_TOKENS)

        const llmAnalysisResponse = await this.analyzeResults(params.query, limitedResults)

        return this.onSuccess(
          params,
          llmAnalysisResponse,
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
        ...ChatMessageBuilder.functionCallResultWithVariables(
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
        ...ChatMessageBuilder.functionCallResultWithVariables(
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
      timeout: FETCH_WEBPAGE_TIMEOUT,
    });
  }

  private async processWebpage(url: string) {
    const response = await this.fetchHTML(url);
    const html = response.data;
    const chunks = this.chunker.chunk(html);
    return chunks;
  }

  private async analyzeResults(query: string, results: string[]) {
    const analyzerPrompt = `I will give you chunks of text from different webpages. 
    I want to extract ${
      query
    } from them. Keep in mind some information may not be properly formatted.
    Do your best to extract as much information as you can.

    Prioritize accuracy. Do not settle for the first piece of information found if there are more precise results available
    Example: "population of New York in 2020" and you get the following results: ["1.5 million",  "nearly 1.600.000", "1,611,989"], you will take "1,611,989"
    
    Chunks: ${JSON.stringify(results)}.
    Specify if the information is incomplete but still return it`

    return await this.askLlm(analyzerPrompt);
  }

  private limitResults(results: string[], maxTokens: number): string[] {
    const resultsTokens = results.map(r => this.tokenizer.encode(r).length)
    const limitedResults: string[] = [];

    let totalTokens = 0

    for (let i = 0; i < resultsTokens.length; i++) {
      totalTokens += resultsTokens[i]
      if (totalTokens <= maxTokens) {
        limitedResults.push(results[i])
      }
    }

    return limitedResults
  }
}

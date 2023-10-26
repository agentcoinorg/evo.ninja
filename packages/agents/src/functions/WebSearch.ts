import {
  AgentFunctionResult,
  AgentOutputType,
  AgentVariables,
  ChatMessageBuilder,
  LlmApi,
  TextChunker,
  Tokenizer,
  trimText,
  Rag,
  ArrayRecombiner,
} from "@evo-ninja/agent-utils";
import axios from "axios";
import { FUNCTION_CALL_FAILED, FUNCTION_CALL_SUCCESS_CONTENT } from "../agents/Scripter/utils";
import { Agent } from "../Agent";
import { LlmAgentFunctionBase } from "../LlmAgentFunctionBase";
import TurndownService from "turndown";
import { AgentContext } from "@evo-ninja/agent-utils";
import { load } from "cheerio";
import { Prompt } from "../agents/Chameleon/Prompt";

export interface WebSearchFuncParameters {
  queries: string[];
}

const FETCH_WEBPAGE_TIMEOUT = 4000

export class WebSearchFunction extends LlmAgentFunctionBase<WebSearchFuncParameters> {
  constructor(
    llm: LlmApi,
    tokenizer: Tokenizer,
  ) {
    super(llm, tokenizer);
  }

  name: string = "web_search";
  description: string = `Searches the web for a given query.`;
  parameters: any = {
    type: "object",
    properties: {
      queries: {
        type: "array",
        items: {
            type: "string"
        },
        description: "Queries to search the web for in parallel",
      },
    },
    required: ["queries"],
    additionalProperties: false,
  };

  buildExecutor(agent: Agent<unknown>): (
    params: WebSearchFuncParameters,
    rawParams?: string
  ) => Promise<AgentFunctionResult> {
    return async (
      params: WebSearchFuncParameters
    ): Promise<AgentFunctionResult> => {
      const searches = [];
      for (const query of params.queries) {
        searches.push(
          this.runQuery(agent, query, JSON.stringify({ queries: [query] }))
        );
      }
      const results = await Promise.all(searches);
      return {
        outputs: results.flatMap((x) => x.outputs),
        messages: results.flatMap((x) => x.messages)
      };
    };
  }

  private async runQuery({ context }: Agent<unknown>, query: string, rawParams?: string): Promise<AgentFunctionResult> {
    try {
      if (!context.env.SERP_API_KEY) {
        throw new Error(
          "SERP_API_KEY environment variable is required to use the websearch plugin. See env.template for help"
        );
      }

      const googleResults = await this.searchOnGoogle(
        query,
        context.env.SERP_API_KEY
      );

      const googleResultsAnalysisPrompt = new Prompt()
        .line(`Look at this information:`)
        .json(googleResults)
        .line(`Is it enough to answer: ${query}? If it is, state the answer and say "TRUE`)
        .toString()

      const llmAnalysisResponse = await this.askLlm(
        googleResultsAnalysisPrompt,
        { model: "gpt-3.5-turbo-16k-0613" }
      );

      if (llmAnalysisResponse.includes("TRUE")) {
        return this.onSuccess(
          { queries: [query] },
          llmAnalysisResponse,
          rawParams,
          context.variables
        );
      }

      const searchMatches = await this.searchInPages({
        urls: googleResults.map(x => x.url),
        query,
        context
      })

      const analyzeChunkMatchesPrompt = new Prompt()
      .text(`
        I will give you chunks of text from different webpages.

        I want to extract ${query} from them. Keep in mind some information may not be properly formatted.
        Do your best to extract as much information as you can.

        Prioritize accuracy. Do not settle for the first piece of information found if there are more precise results available
        Example: "population of New York in 2020" and you get the following results:
        ["1.5 million",  "nearly 1.600.000", "1,611,989"], you will take "1,611,989"

        Chunks:
      `)
      .json(searchMatches)
      .line(`Specify if the information is incomplete but still return it`)
      .toString()

      console.log(analyzeChunkMatchesPrompt)

      const analysisFromChunks = await this.askLlm(
        analyzeChunkMatchesPrompt,
        { model: "gpt-3.5-turbo-16k-0613" }
      );

      return this.onSuccess(
        { queries: [query] },
        analysisFromChunks,
        rawParams,
        context.variables
      );
    } catch (err) {
      return this.onError(
        { queries: [query] },
        err.toString(),
        rawParams,
        context.variables
      );
    }
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
          title: `Web search for '${params.queries}'`,
          content: FUNCTION_CALL_SUCCESS_CONTENT(
            this.name,
            params,
            `Found the following result for the web search: '${params.queries}'` +
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
          `Found the following result for the web search: '${params.queries}'` +
            `\`\`\`\n` +
            `${result}\n` +
            `\`\`\``
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
          title: `Web search for '${params.queries}'`,
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
          `Error web searching for '${params.queries}'\n` + 
          `\`\`\`\n` +
          `${trimText(error, 300)}\n` +
          `\`\`\``
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

  private async searchInPages(params: { urls: string[], query: string, context: AgentContext }) {
    const urlsContents = await Promise.all(params.urls.map(async url => {
      try {
        const response = await this.processWebpage(url);
        return response
      } catch(e) {
        params.context.logger.error(`Failed to process ${url}`)
        return ""
      }
    }))

    const webpagesChunks = urlsContents.flatMap(webpageContent =>
      TextChunker.fixedCharacterLength(webpageContent, { chunkLength: 500, overlap: 100 })
    )

    const matches = await Rag.standard(params.context)
      .addItems(webpagesChunks)
      .query(params.query)
      .recombine(ArrayRecombiner.standard({
        limit: 10,
        unique: true,
      }));

    return matches;
  }

  private async processWebpage(url: string) {
    const response = await this.fetchHTML(url);
    const $ = load(response.data);

    $('script').remove();
    $('style').remove();
    $('noscript').remove();
    $('link').remove();
    $('head').remove();
    $('image').remove();
    $('img').remove();

    const html = $.html()

    const turndownService = new TurndownService();
    const markdownText = turndownService
      .turndown(html)
      .split("\n")
      .map(x => x.trim())
      .join("\n")
      .replaceAll("\n", "  ")

    return markdownText
  }

  private async searchOnGoogle(query: string, apiKey: string, maxResults = 6) {
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
      }));

    return result.slice(0, maxResults);
  }
}

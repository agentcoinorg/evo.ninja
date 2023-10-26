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
  AgentContext
} from "@evo-ninja/agent-utils";
import axios from "axios";
import { FUNCTION_CALL_FAILED, FUNCTION_CALL_SUCCESS_CONTENT } from "../agents/Scripter/utils";
import { Agent } from "../Agent";
import { LlmAgentFunctionBase } from "../LlmAgentFunctionBase";
import TurndownService from "turndown";
import { load } from "cheerio";

export interface WebSearchFuncParameters {
  queries: string[];
}

const FETCH_WEBPAGE_TIMEOUT = 4000
const TRUSTED_SOURCES = [
  "wikipedia",
  "statista",
  "macrotrends"
]

export class WebSearchFunction extends LlmAgentFunctionBase<WebSearchFuncParameters> {
  constructor(
    llm: LlmApi,
    tokenizer: Tokenizer,
  ) {
    super(llm, tokenizer);
  }

  name: string = "web_search";
  description: string = `Searches the web for multiple queries.`;
  parameters: any = {
    type: "object",
    properties: {
      queries: {
        type: "array",
        items: {
            type: "string"
        },
        description: "Queries with all details to search the web for in parallel",
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

      const containsTrustedSource = googleResults.some(x => x.trustedSource)
      const resultsFromTrustedSources = containsTrustedSource ? googleResults
      .filter(x => x.trustedSource) : googleResults.slice(0, 4)

      const searchInPagesResults = await this.searchInPages({
        urls: resultsFromTrustedSources.map(x => x.url),
        query,
        context
      })

      return this.onSuccess(
        { queries: [query] },
        JSON.stringify(searchInPagesResults, null, 2),
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
        return {
          url,
          response
        }
      } catch(e) {
        params.context.logger.error(`Failed to process ${url}`)
        return {
          url,
          response: ""
        }
      }
    }))

    const webpagesChunks = urlsContents.map(webpageContent => ({
      url: webpageContent.url,
      chunks: TextChunker.fixedCharacterLength(webpageContent.response, { chunkLength: 550, overlap: 110 })
    }))

    const results = await Promise.all(webpagesChunks.map(async (webpageChunks) => {
      const items = webpageChunks.chunks.map((chunk) => ({
        chunk,
        url: webpageChunks.url,
      }))

      const matches = await Rag.standard<{ chunk: string; url: string }>(params.context)
      .addItems(items)
      .selector(x => x.chunk)
      .query(params.query)
      .recombine(ArrayRecombiner.standard({
        limit: 4,
        unique: true,
      }));

      return matches
    }))

    const otherResults = await Rag.standard<{ chunk: string; url: string }>(params.context)
      .addItems(results.flat())
      .selector(x => x.chunk)
      .query(params.query)
      .recombine(ArrayRecombiner.standard({
        limit: 10,
        unique: true,
        sort: "index"
      }));

    const accumulatedResults = otherResults.reduce((prev, { chunk, url }) => {
      if (prev[url]) {
        prev[url] += "\n...\n" + chunk
      } else {
        prev[url] = chunk
      }

      return prev;
    }, {} as Record<string, string>);

    return Object.entries(accumulatedResults).map(([url, response]) => ({
      url,
      content: response
    }))
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

  private async searchOnGoogle(query: string, apiKey: string) {
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
        trustedSource: TRUSTED_SOURCES.some(x => result.link.includes(x))
      }));

    return result;
  }
}
import {
  AgentFunctionResult,
  AgentOutputType,
  AgentVariables,
  ChatMessageBuilder,
  LlmApi,
  TextChunker,
  Tokenizer,
  trimText,
} from "@evo-ninja/agent-utils";
import axios from "axios";
import { FUNCTION_CALL_FAILED, FUNCTION_CALL_SUCCESS_CONTENT } from "../agents/Scripter/utils";
import { Agent } from "../Agent";
import { LlmAgentFunctionBase } from "../LlmAgentFunctionBase";
import TurndownService from "turndown";
import { Rag } from "../agents/Chameleon/Rag";
import { AgentContext } from "../AgentContext";
import { load } from "cheerio";

export interface WebSearchFuncParameters {
  query: string;
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
      query: {
        type: "string",
        description: "Query to search the web for",
      },
    },
    required: ["query"],
    additionalProperties: false,
  };

  buildExecutor({ context }: Agent<unknown>): (
    params: WebSearchFuncParameters,
    rawParams?: string
  ) => Promise<AgentFunctionResult> {
    return async (
      params: WebSearchFuncParameters,
      rawParams?: string
    ): Promise<AgentFunctionResult> => {
      try {
        if (!context.env.SERP_API_KEY) {
          throw new Error(
            "SERP_API_KEY environment variable is required to use the websearch plugin. See env.template for help"
          );
        }

        const googleResults = await this.searchOnGoogle(
          params.query,
          context.env.SERP_API_KEY
        );

        const llmAnalysisResponse = await this.askLlm(`Look at this information: ${JSON.stringify(googleResults, null, 2)}.
        Is it enough to answer: ${params.query}? . If it is, state the answer and say "TRUE"`)

        if (llmAnalysisResponse.includes("TRUE")) {
          return this.onSuccess(
            params,
            llmAnalysisResponse,
            rawParams,
            context.variables
          );
        }

        const results = await this.searchInPages({
          urls: googleResults.map(x => x.url),
          query: params.query,
          context
        })
  
        return this.onSuccess(
          params,
          results,
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

    const matches = await Rag.standard(webpagesChunks, params.context)
      .selector(x => x)
      .limit(10)
      .onlyUnique()
      .query(params.query)
      .unique()
      .then(async (results) => {
        return results
      })

    console.log(`Best matches: ${JSON.stringify(matches, null, 2)}`)

    const llmAnalysisResponse = await this.analyzeResults(params.query, matches)

    // const evaluation = await this.askLlm(`Look at this information: ${llmAnalysisResponse}.
    //   does it completely, fully, and precisely answer: ${params.query}?.
    //   If not, what is missing?`
    // )

    // const response = `Found data: ${llmAnalysisResponse}\n\nEvaluation of the found data: ${evaluation}`

    return llmAnalysisResponse
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

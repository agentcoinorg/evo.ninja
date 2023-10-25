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
import { Prompt } from "../agents/Chameleon/Prompt";

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

        const googleResultsAnalysisPrompt = new Prompt()
          .line(`Look at this information:`)
          .json(googleResults)
          .line(`Is it enough to answer: ${params.query}? If it is, state the answer and say "TRUE`)
          .toString()

        const llmAnalysisResponse = await this.askLlm(googleResultsAnalysisPrompt)

        if (llmAnalysisResponse.includes("TRUE")) {
          return this.onSuccess(
            params,
            llmAnalysisResponse,
            rawParams,
            context.variables
          );
        }

        const searchResults = await this.searchInPages({
          urls: googleResults.map(x => x.url),
          query: params.query,
          context
        })

        const analysisFromChunks = await this.askLlm(new Prompt()
        .text(`
          I will give you different results for the query: ${params.query}.

          I want you to extract the information from them to answer the query.
          
          Prioritize precision. If there are multiple results that contain the same information, choose the one that is more precise.
          Example: "population of New York in 2020" and you get the following results:
          ["1.5 million",  "nearly 1.600.000", "1,611,989"], you will take "1,611,989"

          First take the most precise result, determine what's missing and fill it with pieces of other results.
          If there are multiple result pieces that contain the same information, choose the one that is more precise.

          The most precise results might be scattered across multiple results.

          Results:
        `)
        .json(searchResults)
        .line(`Specify if the information is incomplete but still return it.`)
        .toString(), {
          model: "gpt-3.5-turbo-16k-0613"
        })

        const missingAnalysis = await this.askLlm(new Prompt()
        .text(`Ill give you a query and a piece of information.
        If the information can't completely answer the query, say "TRUE" and specify what's missing.
        If not, just return the information.
        
        Query: ${params.query}
        
        Information: ${analysisFromChunks}
        `)
        .toString())

        if (missingAnalysis.includes("TRUE")) {
          const missingQuery = missingAnalysis.replace("TRUE", "").trim()

          const missingResults = await Rag.standard(searchResults, context)
            .limit(2)
            .selector(x => x)
            .sortByRelevance()
            .query(missingQuery)

          console.log("missingResults: ", missingResults)
        }

        // const result = await this.askLlm(new Prompt()
        // .text(`Extract the information from the following text, removing any reasoning: ${analysisFromChunks}`)
        // .toString(), {
        //   model: "gpt-3.5-turbo-16k-0613"
        // })
  
        return this.onSuccess(
          params,
          analysisFromChunks,
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
        const matches = await Rag.filterWithSurroundingText(response, params.query, params.context, {
          chunkLength: 100,
          surroundingCharacters: 750,
          overlap: 20,
          charLimit: 4000
        })

        return matches
      } catch(e) {
        params.context.logger.error(`Failed to process ${url}`)
        return ""
      }
    }))

    // const results: string[] = [];

    // await Promise.all(urlsContents.map(async (matches) => {
    //   const extracted = await this.extractInfoWithLLM({
    //     info: matches,
    //     query: params.query
    //   })

    //   console.log("extracted: ", extracted)

    //   results.push(extracted)
    // }))

    // return results;
    return urlsContents;
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
      .replaceAll(/--+/gm, "-")
      .replaceAll(/==+/gm, "-")

    return markdownText
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
      }));

    return result.slice(0, maxResults);
  }

  private async extractInfoWithLLM(args: {
    info: string;
    query: string;
  }) {
    const analyzeChunkMatchesPrompt = new Prompt()
      .text(`
        I will give you pieces of information.

        I want to extract ${args.query} from them. Keep in mind some information may not be properly formatted.
        Do your best to extract as much information as you can.

        Prioritize accuracy. Do not settle for the first piece of information found if there are more precise results available

        Prioritize accuracy. Do not settle for the first piece of information found if there are more precise results available
        Example: "population of New York in 2020" and you get the following results:
        ["1.5 million",  "nearly 1.600.000", "1,611,989"], you will take "1,611,989"

        Information:

        ${args.info}

        Specify if the information is incomplete but still return it
      `)
      .toString()

    return await this.askLlm(analyzeChunkMatchesPrompt, {
      model: "gpt-3.5-turbo-16k-0613"
    })
  }
}

import { AgentContext, AgentFunctionResult, AgentOutputType, AgentVariables, ArrayRecombiner, ChatMessageBuilder, LlmApi, Prompt, Rag, TextChunker, Tokenizer, trimText } from "@/agent-core";
import { FUNCTION_CALL_FAILED, FUNCTION_CALL_SUCCESS_CONTENT } from "../agents/Scripter/utils";
import { Agent } from "../agents/utils";
import { LlmAgentFunctionBase, processWebpage, searchOnGoogle } from "./utils";
import axios from "axios"

export interface WebSearchFuncParameters {
  queries: string[];
}

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
      let googleResults;
      if (typeof window === "object") {
        const results = await axios.get<{
          googleResults: {
            title: string;
            url: string;
            description: string;
            trustedSource: boolean;
          }[];
        }>(`/api/search?query=${query}`);
        googleResults = results.data.googleResults;
      } else {
        if (!context.env.SERP_API_KEY) {
          throw new Error(
            "SERP_API_KEY environment variable is required to use the websearch plugin. See env.template for help"
          );
        }
        googleResults = await searchOnGoogle(query, context.env.SERP_API_KEY);
      }

      // Remove all PDFs
      const urls = googleResults.map(x => x.url).filter(u => !u.endsWith(".pdf")) 

      const searchMatches = await this.searchInPages({
        urls,
        query,
        context
      })

      const analyzeChunkMatchesPrompt = new Prompt()
        .text(`
          I will give you chunks of text from different webpages.

          I want to extract ${query}. Keep in mind some information may not be properly formatted.
          Do your best to extract as much information as you can.

          Prioritize decimal precision. Aim for answers with 3 decimal places, if possible; if not settle for 2 decimal places.
          Only take 1 decimal or rounded numbers when absolutely necessary.

          Chunks: ${searchMatches.join("\n------------\n")}
        `)
        .line(`Specify if the information is incomplete but still return it`)
        .toString()

      const analysisFromChunks = await this.askLlm(analyzeChunkMatchesPrompt, {
        maxResponseTokens: 200
      })

      return this.onSuccess(
        { queries: [query] },
        analysisFromChunks,
        rawParams,
        context.variables,
      );
    } catch (err) {
      return this.onError(
        { queries: [query] },
        err.toString(),
        rawParams,
        context.variables,
      );
    }
  }

  private onSuccess(
    params: WebSearchFuncParameters,
    result: string,
    rawParams: string | undefined,
    variables: AgentVariables,
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
    variables: AgentVariables,
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

  private async searchInPages(params: { urls: string[], query: string, context: AgentContext }) {
    const urlsContents = await Promise.all(params.urls.map(async url => {
      try {
        let response: string;
        if (typeof window === "object") {
          const result = await axios.get<{ text: string }>(`/api/process-web-page?url=${url}`)
          response = result.data.text
        } else {
          response = await processWebpage(url);
        }
        return {
          url,
          response
        }
      } catch(e) {
        return {
          url,
          response: ""
        }
      }
    }))

    const webpagesChunks = urlsContents.map(webpageContent => ({
      url: webpageContent.url,
      chunks: TextChunker.fixedCharacterLength(
        webpageContent.response,
        { chunkLength: 550, overlap: 110 }
      )
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

    return otherResults.map(x => x.chunk)
  }
}
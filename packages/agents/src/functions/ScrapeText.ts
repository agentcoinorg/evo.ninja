import { AgentFunctionResult, AgentOutputType, ChatMessageBuilder, trimText } from "@evo-ninja/agent-utils";
import { load } from "cheerio";
import axios from "axios";
import { Agent } from "../Agent";
import { AgentFunctionBase } from "../AgentFunctionBase";
import { FUNCTION_CALL_FAILED, FUNCTION_CALL_SUCCESS_CONTENT } from "../agents/Scripter/utils";

const FETCH_WEBPAGE_TIMEOUT = 8000

interface ScrapeTextFuncParameters {
  url: string;
}

export class ScrapeTextFunction extends AgentFunctionBase<{ url: string }> {
  get description(): string {
    return "This is a naive function that opens a web page and extracts all text present in the HTML. Due to its broad approach, it may retrieve a large amount of irrelevant or extraneous data. It's recommended to use this function as a last resort when more precise methods fail or are unavailable"
  }
  
  name: string = "web_scrapeText";
  parameters: any = {
    type: "object",
    properties: {
      url: {
        type: "string",
      },
    },
    required: ["url"],
    additionalProperties: false
  };

  buildExecutor(agent: Agent<unknown>): (params: { url: string; }, rawParams?: string | undefined) => Promise<AgentFunctionResult> {
    return async (
      params: ScrapeTextFuncParameters,
      rawParams?: string
    ): Promise<AgentFunctionResult> => {
      try {
        const response = await this.processWebpage(params.url);

        return this.onSuccess(
          params,
          JSON.stringify(response),
          rawParams
        );
      } catch (err) {
        return this.onError(
          params,
          err.toString(),
          rawParams
        );
      }
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
    const $ = load(html);

    // Remove not needed tags
    $('script').remove();
    $('style').remove();
    $('noscript').remove();
    $('link').remove();
    $('head').remove();

    const texts: string[] = [];

    $('*').each((_, element) => {
      const text = $(element).text().trim();
      if (text) {
        const sanitizedText = this.sanitize(text);
        texts.push(sanitizedText);
      }
    });

    return texts;
  }

  private sanitize(html: string): string {
    return html.replaceAll("\t", "")
          .replaceAll("\\\\t", "")
          .replaceAll("\n", " ")
          .replaceAll("\\\\n", "\n")
          .replace(/ +(?= )/g, "")
          .trim()
  }

  private onSuccess(
    params: ScrapeTextFuncParameters,
    result: string,
    rawParams: string | undefined
  ): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `Scrape text from '${params.url}'`,
          content: FUNCTION_CALL_SUCCESS_CONTENT(
            this.name,
            params,
            `Found the following text in '${params.url}': ` +
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
          `Scrape text from '${params.url}'` +
            `\`\`\`\n` +
            `${result}\n` +
            `\`\`\``
        ),
      ],
    };
  }

  private onError(
    params: ScrapeTextFuncParameters,
    error: string,
    rawParams: string | undefined
  ) {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `Scrape text from '${params.url}'`,
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
          `Error scraping text from '${params.url}'\n` + 
          `\`\`\`\n` +
          `${trimText(error, 300)}\n` +
          `\`\`\``
        ),
      ],
    };
  }
}
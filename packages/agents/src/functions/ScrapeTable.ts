import { AgentFunctionResult, AgentOutputType, ChatMessageBuilder, trimText } from "@/agent-core";
import { load } from "cheerio";
import { FUNCTION_CALL_FAILED, FUNCTION_CALL_SUCCESS_CONTENT } from "../agents/Scripter/utils";
import { Agent } from "../agents/utils";
import { AgentFunctionBase, fetchHTML } from "./utils";

interface ScrapeTableFuncParameters {
  url: string;
}

export class ScrapeTableFunction extends AgentFunctionBase<ScrapeTableFuncParameters> {
  get description(): string {
    return "Opens a web page and extracts all table data present in the HTML."
  }
  
  name: string = "web_scrapeTable";
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

  buildExecutor(agent: Agent<unknown>): (params: ScrapeTableFuncParameters, rawParams?: string | undefined) => Promise<AgentFunctionResult> {
    return async (
      params: ScrapeTableFuncParameters,
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

  private async processWebpage(url: string): Promise<string> {
    const response = await fetchHTML(url);
    const html = response.data;
    const $ = load(html);
    let markdownContent: string[] = [];

    $('table').each((_, tableElement) => {
        let headers: string[] = [];
        let separator: string[] = [];

        // Handle header
        $(tableElement).find('thead').each((_, theadElement) => {
            $(theadElement).find('tr').each((_, headerRowElement) => {
                $(headerRowElement).find('th').each((_, cellElement) => {
                    const cellText = $(cellElement).text().trim();
                    headers.push(cellText);
                    separator.push('---');
                });
            });
            markdownContent.push(`| ${headers.join(' | ')} |`);
            markdownContent.push(`| ${separator.join(' | ')} |`);
        });

        // Handle body
        $(tableElement).find('tbody').each((_, tbodyElement) => {
            $(tbodyElement).find('tr').each((_, rowElement) => {
                let rowContent: string[] = [];
                $(rowElement).find('td').each((_, cellElement) => {
                    rowContent.push($(cellElement).text().trim());
                });
                markdownContent.push(`| ${rowContent.join(' | ')} |`);
            });
        });
    });

    return markdownContent.join('\n');
  }

  private onSuccess(
    params: ScrapeTableFuncParameters,
    result: string,
    rawParams: string | undefined
  ): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `Scrape table from '${params.url}'`,
          content: FUNCTION_CALL_SUCCESS_CONTENT(
            this.name,
            params,
            `Found the following table in '${params.url}':` +
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
          `Scrape table from '${params.url}'` +
            `\`\`\`\n` +
            `${result}\n` +
            `\`\`\``
        ),
      ],
    };
  }

  private onError(
    params: ScrapeTableFuncParameters,
    error: string,
    rawParams: string | undefined
  ) {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `Scrape table from '${params.url}'`,
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
          `Error scraping table from '${params.url}'\n` + 
          `\`\`\`\n` +
          `${trimText(error, 300)}\n` +
          `\`\`\``
        ),
      ],
    };
  }
}
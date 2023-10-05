import { SubAgentFunctionBase } from "../SubAgentFunction"

export class ScrapeTextFunction extends SubAgentFunctionBase<{ url: string }> {
  get name() {
    return "web_scrapeText"
  }

  get description() {
    return "Open a web page and scrape all text found in the html"
  }

  get parameters() {
    return {
      type: "object",
      properties: {
        url: {
          type: "string",
        },
      },
      required: ["query"],
      additionalProperties: false
    }
  }
}
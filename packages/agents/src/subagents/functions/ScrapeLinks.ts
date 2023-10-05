import { SubAgentFunctionBase } from "../SubAgentFunction"

export class ScrapeLinksFunction extends SubAgentFunctionBase<{ url: string }> {
  get name() {
    return "web_scrapeLinks"
  }

  get description() {
    return "Open a web page and scrape all links found in the html"
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
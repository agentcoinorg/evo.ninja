import { ScriptFunction } from "../ScriptFunction"

export class ScrapeTextFunction extends ScriptFunction<{ url: string }> {
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
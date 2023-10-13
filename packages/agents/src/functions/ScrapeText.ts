import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class ScrapeTextFunction extends ScriptFunction<{ url: string }> {
  get name() {
    return "web_scrapeText"
  }

  get description() {
    return "This is a naive function that opens a web page and extracts all text present in the HTML. Due to its broad approach, it may retrieve a large amount of irrelevant or extraneous data. It's recommended to use this function as a last resort when more precise methods fail or are unavailable."
  }

  get parameters() {
    return {
      type: "object",
      properties: {
        url: {
          type: "string",
        },
      },
      required: ["url"],
      additionalProperties: false
    }
  }
}
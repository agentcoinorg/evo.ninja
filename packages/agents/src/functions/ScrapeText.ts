import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class ScrapeTextFunction extends ScriptFunction<{ url: string }> {
  name: string = "web_scrapeText";
  description: string = "This is a naive function that opens a web page and extracts all text present in the HTML. Due to its broad approach, it may retrieve a large amount of irrelevant or extraneous data. It's recommended to use this function as a last resort when more precise methods fail or are unavailable.";
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
}
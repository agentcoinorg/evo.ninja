import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class ScrapeLinksFunction extends ScriptFunction<{ url: string }> {
  name: string = "web_scrapeLinks";
  description: string = "Open a web page and scrape all links found in the html";
  parameters: any = {
    type: "object",
    properties: {
      url: {
        type: "string",
      },
    },
    required: ["query"],
    additionalProperties: false
  };
}
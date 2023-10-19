import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class ScrapeTextFunction extends ScriptFunction<{ url: string }> {
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
}
import { ScriptFunction } from "./utils";

export class ScrapeLinksFunction extends ScriptFunction<{ url: string }> {
  name: string = "web_scrapeLinks";
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
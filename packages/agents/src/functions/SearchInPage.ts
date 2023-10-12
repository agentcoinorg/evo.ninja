import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class SearchInPageFunction extends ScriptFunction<{ url: string; query: string }> {
  get name() {
    return "web_searchInPage"
  }

  get description() {
    return "Conducts a targeted search on a web page, using a text query."
  }

  get parameters() {
    return {
      type: "object",
      properties: {
        url: {
          type: "string",
        },
        query: {
          type: "string",
        },
      },
      required: ["url", "query"],
      additionalProperties: false
    }
  }
}
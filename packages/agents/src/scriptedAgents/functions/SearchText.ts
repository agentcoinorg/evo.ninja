import { ScriptFunction } from "../ScriptFunction"

export class SearchTextFunction extends ScriptFunction<{ url: string; queryKeywords: string[] }> {
  get name() {
    return "web_searchText"
  }

  get description() {
    return "Fuzzy searches for specific information given a text query in a web page. Query should be keywords for the fuzzy search"
  }

  get parameters() {
    return {
      type: "object",
      properties: {
        url: {
          type: "string",
        },
        queryKeywords: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
      required: ["url", "query"],
      additionalProperties: false
    }
  }
}
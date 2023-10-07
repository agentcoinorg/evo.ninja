import { ScriptFunction } from "../ScriptFunction"

export class FuzzySearchFunction extends ScriptFunction<{ url: string; queryKeywords: string[] }> {
  get name() {
    return "web_fuzzySearch"
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
      required: ["url", "queryKeywords"],
      additionalProperties: false
    }
  }
}
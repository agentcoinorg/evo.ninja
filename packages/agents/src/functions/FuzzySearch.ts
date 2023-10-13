import { ScriptFunction } from "../scriptedAgents/ScriptFunction"

export class FuzzySearchFunction extends ScriptFunction<{ url: string; queryKeywords: string[] }> {
  get name() {
    return "web_fuzzySearch"
  }

  get description() {
    return "The fuzzy search function conducts a targeted search on a web page, using a text query comprised of specific keywords. Unlike broad or naive search methods, this function employs advanced algorithms to find close matches, even if they're not exact. This ensures a higher likelihood of retrieving relevant and precise information. When crafting your query, prioritize using distinct keywords to optimize the accuracy of the search results."
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
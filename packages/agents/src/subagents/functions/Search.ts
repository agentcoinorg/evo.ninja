import { SubAgentFunctionBase } from "../SubAgentFunction"

export class SearchFunction extends SubAgentFunctionBase<{ query: string }> {
  get name() {
    return "web_search"
  }

  get description() {
    return "Searches the web for a given query, using a search engine, and returns search results an array of { title, url, description } objects, ordered by relevance"
  }

  get parameters() {
    return {
      type: "object",
      properties: {
        query: {
          type: "string",
        },
      },
      required: ["query"],
      additionalProperties: false
    }
  }
}
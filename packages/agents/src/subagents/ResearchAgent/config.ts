import { AgentOutputType, ChatMessageBuilder, trimText } from "@evo-ninja/agent-utils";
import { ON_GOAL_ACHIEVED_FN_NAME, ON_GOAL_FAILED_FN_NAME } from "../constants";
import { SubAgentConfig } from "../SubAgent";

const AGENT_NAME = "researcher";
const SEARCH_FN_NAME = "web_search";
const SCRAPE_TEXT_FN_NAME = "web_scrapeText";
const SCRAPE_LINKS_FN_NAME = "web_scrapeLinks";
const WRITE_FILE_FN_NAME = "fs_writeFile";

export const RESEARCH_AGENT_CONFIG: SubAgentConfig = {
  initialMessages: ({ goal }) => [
    { role: "assistant", content: `You are an agent that searches the web for information, called "${AGENT_NAME}".\n` +
    `Only scrape if you're certain the information you're looking for isn't available in the result of search.\n`},
    { role: "user", content: `You have been asked by the user to achieve the following goal: ${goal}`},
  ],
  loopPreventionPrompt: "Assistant, you appear to be in a loop, try executing a different function.",
  functions: {
    [ON_GOAL_ACHIEVED_FN_NAME]: {
      description: "Informs the user that the goal has been achieved.",
      parameters: {
        type: "object",
        properties: { },
      },
      success: () => ({
        outputs: [
          {
            type: AgentOutputType.Success,
            title: `[${AGENT_NAME}] ${ON_GOAL_ACHIEVED_FN_NAME}`
          }
        ],
        messages: []
      }),
      failure: (_: any, error: string) => ({
        outputs: [
          {
            type: AgentOutputType.Error,
            title: `[${AGENT_NAME}] Error in ${ON_GOAL_ACHIEVED_FN_NAME}: ${error}`
          }
        ],
        messages: []
      })
    },
    [ON_GOAL_FAILED_FN_NAME]: {
      description: "Informs the user that the agent could not achieve the goal.",
      parameters: {
        type: "object",
        properties: { },
      },
      success: () => ({
        outputs: [
          {
            type: AgentOutputType.Error,
            title: `[${AGENT_NAME}] ${ON_GOAL_FAILED_FN_NAME}`
          }
        ],
        messages: []
      }),
      failure: (_: any, error: string) => ({
        outputs: [
          {
            type: AgentOutputType.Error,
            title: `[${AGENT_NAME}] Error in ${ON_GOAL_FAILED_FN_NAME}: ${error}`
          }
        ],
        messages: []
      })
    },
    [SEARCH_FN_NAME]: {
      description: "Searches the web for a given query, using a search engine, and returns search results an array of { title, url, description } objects, ordered by relevance",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
          },
        },
        required: ["query"],
        additionalProperties: false
      },
      success: (params: { query: string }, result?: string) => ({
        outputs: [
          {
            type: AgentOutputType.Success,
            title: `[${AGENT_NAME}] ${SEARCH_FN_NAME}`,
            content: `${params.query}`
          }
        ],
        messages: [
          ChatMessageBuilder.functionCall(SEARCH_FN_NAME, params),
          ChatMessageBuilder.functionCallResult(SEARCH_FN_NAME, result)
        ]
      }),
      failure: (params: any, error: string) => ({
        outputs: [
          {
            type: AgentOutputType.Error,
            title: `[${AGENT_NAME}] Error in ${SEARCH_FN_NAME}: ${error}`
          }
        ],
        messages: [
          ChatMessageBuilder.functionCall(SEARCH_FN_NAME, params),
          ChatMessageBuilder.functionCallResult(SEARCH_FN_NAME, `Error: ${error}`)
        ]
      }),
    },
    [SCRAPE_TEXT_FN_NAME]: {
      description: "Open a web page and scrape all text found in the html",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
          },
        },
        required: ["query"],
        additionalProperties: false
      },
      success: (params: { url: string }, result?: string) => ({
        outputs: [
          {
            type: AgentOutputType.Success,
            title: `[${AGENT_NAME}] ${SCRAPE_TEXT_FN_NAME}`,
            content: `${params.url}`
          }
        ],
        messages: [
          ChatMessageBuilder.functionCall(SCRAPE_TEXT_FN_NAME, params),
          ChatMessageBuilder.functionCallResult(SCRAPE_TEXT_FN_NAME, result)
        ]
      }),
      failure: (params: any, error: string) => ({
        outputs: [
          {
            type: AgentOutputType.Error,
            title: `[${AGENT_NAME}] Error in ${SCRAPE_TEXT_FN_NAME}: ${error}`
          }
        ],
        messages: [
          ChatMessageBuilder.functionCall(SCRAPE_TEXT_FN_NAME, params),
          ChatMessageBuilder.functionCallResult(SCRAPE_TEXT_FN_NAME, `Error: ${error}`)
        ]
      }),
    },
    [SCRAPE_LINKS_FN_NAME]: {
      description: "Open a web page and scrape all links found in the html",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
          },
        },
        required: ["query"],
        additionalProperties: false
      },
      success: (params: { url: string }, result?: string) => ({
        outputs: [
          {
            type: AgentOutputType.Success,
            title: `[${AGENT_NAME}] ${SCRAPE_LINKS_FN_NAME}`,
            content: `${params.url}`
          }
        ],
        messages: [
          ChatMessageBuilder.functionCall(SCRAPE_LINKS_FN_NAME, params),
          ChatMessageBuilder.functionCallResult(SCRAPE_LINKS_FN_NAME, result)
        ]
      }),
      failure: (params: any, error: string) => ({
        outputs: [
          {
            type: AgentOutputType.Error,
            title: `[${AGENT_NAME}] Error in ${SCRAPE_LINKS_FN_NAME}: ${error}`
          }
        ],
        messages: [
          ChatMessageBuilder.functionCall(SCRAPE_LINKS_FN_NAME, params),
          ChatMessageBuilder.functionCallResult(SCRAPE_LINKS_FN_NAME, `Error: ${error}`)
        ]
      }),
    },
    [WRITE_FILE_FN_NAME]: {
      description: "Writes data to a file, replacing the file if it already exists.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
          },
          data: {
            type: "string"
          },
          encoding: {
            type: "string"
          },
        },
        required: ["path", "data", "encoding"],
        additionalProperties: false
      },
      success: (params: {
        path: string;
        data: string;
        encoding: string;
      }, result: string) => ({
        outputs: [
          {
            type: AgentOutputType.Success,
            title: `[${AGENT_NAME}] ${WRITE_FILE_FN_NAME}`,
            content: `${params.path}\n` +
              `${params.encoding}\n` +
              `${trimText(params.data, 200)}`
          }
        ],
        messages: [
          ChatMessageBuilder.functionCall(WRITE_FILE_FN_NAME, params),
          ChatMessageBuilder.functionCallResult(WRITE_FILE_FN_NAME, result)
        ]
      }),
      failure: (params: any, error: string) => ({
        outputs: [
          {
            type: AgentOutputType.Error,
            title: `[${AGENT_NAME}] Error in ${WRITE_FILE_FN_NAME}: ${error}`
          }
        ],
        messages: [
          ChatMessageBuilder.functionCall(WRITE_FILE_FN_NAME, params),
          ChatMessageBuilder.functionCallResult(WRITE_FILE_FN_NAME, `Error: ${error}`)
        ]
      }),
    }
  }
}
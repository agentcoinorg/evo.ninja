import {
  AgentOutputType,
  Chat,
  ChatMessageBuilder,
  Env,
  LlmApi,
  Logger,
  Scripts,
  Workspace,
  WrapClient,
  agentPlugin,
  trimText,
} from "@evo-ninja/agent-utils";
import { AgentConfig, SubAgent } from "../SubAgent";

export interface ResearchAgentRunArgs {
  goal: string;
}

export const AGENT_CONFIG: AgentConfig<ResearchAgentRunArgs> = {
  name: "researcher",
  initialMessages: (agentName: string, { goal }) => [
    { role: "system", content: `You are an agent that searches the web for information, called "${agentName}".\n` +
    `Only scrape if you're certain the information you're looking for isn't available in the result of search.\n`},
    { role: "user", content: `You have been asked by the user to achieve the following goal: ${goal}`},
  ],
  loopPreventionPrompt: "Assistant, you appear to be in a loop, try executing a different function.",
  functions: {
    agent_onGoalAchieved: {
      description: "Informs the user that the goal has been achieved.",
      parameters: {
        type: "object",
        properties: { },
      },
      isTermination: true,
      success: (agentName: string, functionName: string) => ({
        outputs: [
          {
            type: AgentOutputType.Success,
            title: `[${agentName}] ${functionName}`
          }
        ],
        messages: []
      }),
      fail: (agentName: string, functionName: string, _: any, error: string) => ({
        outputs: [
          {
            type: AgentOutputType.Error,
            title: `[${agentName}] Error in ${functionName}: ${error}`
          }
        ],
        messages: []
      })
    },
    agent_onGoalFailed: {
      description: "Informs the user that the agent could not achieve the goal.",
      parameters: {
        type: "object",
        properties: { },
      },
      isTermination: true,
      success: (agentName: string, functionName: string) => ({
        outputs: [
          {
            type: AgentOutputType.Error,
            title: `[${agentName}] ${functionName}`
          }
        ],
        messages: []
      }),
      fail: (agentName: string, functionName: string, _: any, error: string) => ({
        outputs: [
          {
            type: AgentOutputType.Error,
            title: `[${agentName}] Error in ${functionName}: ${error}`
          }
        ],
        messages: []
      })
    },
    web_search: {
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
      success: (agentName: string, functionName: string, params: { query: string }, result: string) => ({
        outputs: [
          {
            type: AgentOutputType.Success,
            title: `[${agentName}] ${functionName}`,
            content: `${params.query}`
          }
        ],
        messages: [
          ChatMessageBuilder.functionCall(functionName, params),
          ChatMessageBuilder.functionCallResponse(functionName, result)
        ]
      }),
      fail: (agentName: string, functionName: string, params: any, error: string) => ({
        outputs: [
          {
            type: AgentOutputType.Error,
            title: `[${agentName}] Error in ${functionName}: ${error}`
          }
        ],
        messages: [
          ChatMessageBuilder.functionCall(functionName, params),
          ChatMessageBuilder.functionCallResponse(functionName, error)
        ]
      }),
      isTermination: false,
    },
    web_scrapeText: {
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
      success: (agentName: string, functionName: string, params: { url: string }, result: string) => ({
        outputs: [
          {
            type: AgentOutputType.Success,
            title: `[${agentName}] ${functionName}`,
            content: `${params.url}`
          }
        ],
        messages: [
          ChatMessageBuilder.functionCall(functionName, params, result),
          ChatMessageBuilder.functionCallResponse(functionName, result)
        ]
      }),
      fail: (agentName: string, functionName: string, params: any, error: string) => ({
        outputs: [
          {
            type: AgentOutputType.Error,
            title: `[${agentName}] Error in ${functionName}: ${error}`
          }
        ],
        messages: [
          ChatMessageBuilder.functionCall(functionName, params),
          ChatMessageBuilder.functionCallResponse(functionName, error)
        ]
      }),
      isTermination: false,
    },
    web_scrapeLinks: {
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
      success: (agentName: string, functionName: string, params: { url: string }, result: string) => ({
        outputs: [
          {
            type: AgentOutputType.Success,
            title: `[${agentName}] ${functionName}`,
            content: `${params.url}`
          }
        ],
        messages: [
          ChatMessageBuilder.functionCall(functionName, params),
          ChatMessageBuilder.functionCallResponse(functionName, result)
        ]
      }),
      fail: (agentName: string, functionName: string, params: any, error: string) => ({
        outputs: [
          {
            type: AgentOutputType.Error,
            title: `[${agentName}] Error in ${functionName}: ${error}`
          }
        ],
        messages: [
          ChatMessageBuilder.functionCall(functionName, params),
          ChatMessageBuilder.functionCallResponse(functionName, error)
        ]
      }),
      isTermination: false,
    },
    fs_writeFile: {
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
      success: (agentName: string, functionName: string, params: {
        path: string;
        data: string;
        encoding: string;
      }, result: string) => ({
        outputs: [
          {
            type: AgentOutputType.Success,
            title: `[${agentName}] ${functionName}`,
            content: `${params.path}\n` +
              `${params.encoding}\n` +
              `${trimText(params.data, 200)}`
          }
        ],
        messages: [
          ChatMessageBuilder.functionCall(functionName, params, result),
          ChatMessageBuilder.functionCallResponse(functionName, result),
        ]
      }),
      fail: (agentName: string, functionName: string, params: any, error: string) => ({
        outputs: [
          {
            type: AgentOutputType.Error,
            title: `[${agentName}] Error in ${functionName}: ${error}`
          }
        ],
        messages: [
          ChatMessageBuilder.functionCall(functionName, params),
          ChatMessageBuilder.functionCallResponse(functionName, error)
        ]
      }),
      isTermination: false,
    }
  }
}

export class ResearchAgent extends SubAgent<ResearchAgentRunArgs> {
  constructor(
    llm: LlmApi,
    chat: Chat,
    workspace: Workspace,
    scripts: Scripts,
    logger: Logger,
    env: Env
    ) {
    
    const agentContext = {
      llm: llm,
      chat: chat,
      scripts: scripts,
      workspace: workspace,
      client: new WrapClient(
        workspace,
        logger,
        agentPlugin({ logger: logger }),
        env
      ),
    };

    super(AGENT_CONFIG, agentContext, logger);
  }
}
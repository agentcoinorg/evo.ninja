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

export interface DevAgentRunArgs {
  goal: string;
}

const AGENT_CONFIG: AgentConfig<DevAgentRunArgs> = {
  name: "dev",
  initialMessages: (agentName: string, { goal }) => [
    { role: "system", content: `You are an expert software engineer named "${agentName}".`},
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
      })
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
      }) => ({
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
          ChatMessageBuilder.functionCall(functionName, params),
        ]
      }),
      isTermination: false,
    }
  }
}

export class DevAgent extends SubAgent<DevAgentRunArgs> {
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
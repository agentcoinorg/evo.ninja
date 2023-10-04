import {
  AgentOutputType,
  Chat,
  ChatMessageBuilder,
  Env,
  LlmApi,
  Logger,
  Scripts,
  Workspace,
  trimText,
} from "@evo-ninja/agent-utils";
import { AgentConfig, SubAgent } from "../SubAgent";

const DEV_AGENT_CONFIG: AgentConfig = {
  name: "dev",
  prompts: {
    initialPrompt: (name: string) => `You are an expert software engineer named "${name}".`,
    goalPrompt: (goal: string) => `You have been asked by the user to achieve the following goal: ${goal}`,
    loopPreventionPrompt: () => "Assistant, you appear to be in a loop, try executing a different function.",
  },
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

export class DevAgent extends SubAgent {
  constructor(
    llm: LlmApi,
    chat: Chat,
    workspace: Workspace,
    scripts: Scripts,
    logger: Logger,
    env: Env
    ) {
    super(DEV_AGENT_CONFIG, llm, chat, workspace, scripts, logger, env);
  }
}
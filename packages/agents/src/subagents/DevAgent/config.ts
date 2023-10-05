import { AgentOutputType, trimText, ChatMessageBuilder } from "@evo-ninja/agent-utils";
import { ON_GOAL_ACHIEVED_FN_NAME, ON_GOAL_FAILED_FN_NAME } from "../constants";
import { SubAgentConfig } from "../SubAgent";

const AGENT_NAME = "dev";
const WRITE_FILE_FN_NAME = "fs_writeFile";

export const DEV_AGENT_CONFIG: SubAgentConfig = {
  initialMessages: ({ goal }) => [
    { role: "assistant", content: `You are an expert software engineer named "${AGENT_NAME}".`},
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
            title: `[${AGENT_NAME}] ${ON_GOAL_ACHIEVED_FN_NAME} Error: ${error}`
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
            title: `[${AGENT_NAME}] ${ON_GOAL_FAILED_FN_NAME} Error: ${error}`
          }
        ],
        messages: []
      })
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
            title: `[${AGENT_NAME}] ${WRITE_FILE_FN_NAME}`,
            content:`${params.path}\n` +
            `${params.encoding}\n` +
            `${trimText(error, 200)}`
          }
        ],
        messages: [
          ChatMessageBuilder.functionCall(WRITE_FILE_FN_NAME, params),
          ChatMessageBuilder.functionCallResult(WRITE_FILE_FN_NAME, `Error: ${error}`)
        ]
      }),
    }
  }
};
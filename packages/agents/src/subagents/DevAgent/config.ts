import { AgentOutputType, trimText, ChatMessageBuilder } from "@evo-ninja/agent-utils";
import { SubAgentConfig } from "../SubAgent";
import { createOnGoalAchievedFunction, createOnGoalFailedFunction } from "../utils";

const AGENT_NAME = "dev";
const WRITE_FILE_FN_NAME = "fs_writeFile";

export const DEV_AGENT_CONFIG: SubAgentConfig = {
  name: "Developer",
  expertise: "developing software",
  initialMessages: ({ goal }) => [
    { role: "assistant", content: `I am an expert software engineer named "${AGENT_NAME}".`},
    { role: "user", content: goal},
  ],
  loopPreventionPrompt: "Assistant, you appear to be in a loop, try executing a different function.",
  functions: [
    createOnGoalAchievedFunction(AGENT_NAME),
    createOnGoalFailedFunction(AGENT_NAME),
    {
    name: WRITE_FILE_FN_NAME,
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
    }) => ({
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
        ChatMessageBuilder.functionCallResult(WRITE_FILE_FN_NAME, "Successfully wrote file.")
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
  }]
};
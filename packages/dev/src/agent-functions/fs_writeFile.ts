import { createScriptExecutor } from "./util";
import { AgentContext } from "../AgentContext";

import {
  AgentFunction,
  AgentFunctionResult,
  AgentOutputType,
  ChatMessageBuilder,
  trimText,
} from "@evo-ninja/agent-utils";

const FN_NAME = "fs_writeFile";

type FuncParameters = {
  path: string;
  data: string;
  encoding: string;
};

const SUCCESS = (params: FuncParameters): AgentFunctionResult => ({
  outputs: [
    {
      type: AgentOutputType.Success,
      title: "[dev] fs_writeFile",
      content: `${params.path}\n` +
        `${params.encoding}\n` +
        `${trimText(params.data, 200)}`
    }
  ],
  messages: [
    ChatMessageBuilder.functionCall(FN_NAME, params),
  ]
});

export const fs_writeFile: AgentFunction<AgentContext> = {
  definition: {
    name: FN_NAME,
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
  },
  buildExecutor(context: AgentContext) {
    return createScriptExecutor(
      context.scripts,
      context.client,
      "fs.writeFile",
      (params) => SUCCESS(params)
    );
  }
};

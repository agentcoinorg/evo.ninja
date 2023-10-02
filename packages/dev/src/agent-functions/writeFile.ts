import { Result, ResultOk } from "@polywrap/result";
import { AgentFunction, AgentFunctionResult, AgentOutputType, ChatMessageBuilder, trimText } from "@evo-ninja/agent-utils";
import { AgentContext } from "../AgentContext";

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

export const writeFile: AgentFunction<AgentContext> = {
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
      required: ["thoughts"],
      additionalProperties: false
    },
  },
  buildExecutor(context: AgentContext) {
    return async (params: FuncParameters): Promise<Result<AgentFunctionResult, string>> => {
      // TODO: executeScript(FN_Name, params)
      return ResultOk(SUCCESS(params));
    };
  }
};

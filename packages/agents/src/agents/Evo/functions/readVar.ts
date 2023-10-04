import { AgentFunctionResult, AgentOutputType, ChatMessageBuilder } from "@evo-ninja/agent-utils";
import { Result, ResultOk } from "@polywrap/result";
import { FUNCTION_CALL_SUCCESS_CONTENT, FUNCTION_CALL_FAILED } from "../utils";
import { AgentFunction } from "../../..";
import { EvoContext } from "../config";

export const READ_VAR_FN_NAME = "readVar";
type READ_VAR_FN_PARAMS = { 
  name: string,
  start: number,
  count: number
}
const READ_VAR_SUCCESS = (params: READ_VAR_FN_PARAMS, varValue: string): AgentFunctionResult => ({
  outputs: [
    {
      type: AgentOutputType.Success,
      title: `Read '${params.name}' variable.`,
      content: FUNCTION_CALL_SUCCESS_CONTENT(
        READ_VAR_FN_NAME,
        params,
        READ_GLOBAL_VAR_OUTPUT(params.name, varValue, params.start, params.count)
      )
    }
  ],
  messages: [
    ChatMessageBuilder.functionCall(READ_VAR_FN_NAME, params),
    ChatMessageBuilder.system(READ_GLOBAL_VAR_MESSAGE(params.name, varValue, params.start, params.count))
  ]
});

const MAX_VAR_LENGTH = 3000;

export const createScriptFunction: {
  definition: AgentFunction;
  buildExecutor: (context: EvoContext) => (params: READ_VAR_FN_PARAMS) => Promise<Result<AgentFunctionResult, string>>;
} = {
  definition: {
    description: `Reads the stored global variable in JSON. If the JSON is longer than ${MAX_VAR_LENGTH} characters, it will be truncated`,
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name of the variable"
        },
        start: {
          type: "number",
          description: "The start character index of the the variable in JSON"
        },
        count: {
          type: "number",
          description: `The number of characters to read from the variable in JSON (max ${MAX_VAR_LENGTH})`
        }
      },
      required: ["name", "start", "count"],
      additionalProperties: false
    },
  },
  buildExecutor(context: EvoContext) {
    return async (params: READ_VAR_FN_PARAMS): Promise<Result<AgentFunctionResult, string>> => {
      if (!context.globals[params.name]) {
        return ResultOk(VAR_NOT_FOUND_ERROR(params));
      } 

      return ResultOk(READ_VAR_SUCCESS(params, context.globals[params.name]));
    };
  }
}

const VAR_NOT_FOUND_ERROR = (params: READ_VAR_FN_PARAMS): AgentFunctionResult => ({
  outputs: [
    {
      type: AgentOutputType.Error,
      title: `Failed to read '${params.name}' variable.`, 
      content: FUNCTION_CALL_FAILED(params, READ_VAR_FN_NAME, `Global variable {{${params.name}}} not found.`)
    }
  ],
  messages: [
    ChatMessageBuilder.functionCall(READ_VAR_FN_NAME, params),
    ChatMessageBuilder.system(FUNCTION_CALL_FAILED(params, READ_VAR_FN_NAME, `Global variable {{${params.name}}} not found.`))
  ]
});

export const READ_GLOBAL_VAR_OUTPUT = (varName: string, value: string | undefined, start: number, count: number) => {
  if (!value || value === "\"undefined\"") {
    return `## Variable {{${varName}}} is undefined`;
  } else if (value.length > MAX_VAR_LENGTH) {
    const val = value.substring(start, start + Math.min(count, MAX_VAR_LENGTH));
    return `## Read variable {{${varName}}}, but it is too large, JSON preview (start: ${start}, count: ${Math.min(count, MAX_VAR_LENGTH)}):\n\`\`\`\n${val}...\n\`\`\``;
  } else {
    return `## Read variable {{${varName}}}, JSON:\n\`\`\`\n${value}\n\`\`\``;
  }
};
export const READ_GLOBAL_VAR_MESSAGE = (varName: string, value: string | undefined, start: number, count: number) => {
  if (!value || value === "\"undefined\"") {
    return `Variable {{${varName}}} is undefined`;
  } else if (value.length > MAX_VAR_LENGTH) {
    const val = value.substring(start, start + Math.min(count, MAX_VAR_LENGTH));
    return `Read variable {{${varName}}}, but it is too large, JSON preview (start: ${start}, count: ${Math.min(count, MAX_VAR_LENGTH)}):\n\`\`\`\n${val}...\n\`\`\``;
  } else {
    return `Read variable {{${varName}}}, JSON:\n\`\`\`\n${value}\n\`\`\``;
  }
};

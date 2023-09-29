import { Result, ResultOk } from "@polywrap/result";
import { AgentFunction, AgentFunctionResult, ChatMessageBuilder, trimText } from "@evo-ninja/agent-utils";
import { AgentContext } from "../AgentContext";
import { FUNCTION_CALL_FAILED, FUNCTION_CALL_SUCCESS_CONTENT } from "../prompts";

const FN_NAME = "readVar";
type FuncParameters = { 
  name: string 
};

const SUCCESS = (params: FuncParameters, varValue: string): AgentFunctionResult => ({
  outputs: [
    {
      type: "success",
      title: `Read '${params.name}' variable.`,
      content: FUNCTION_CALL_SUCCESS_CONTENT(
        FN_NAME,
        params,
        READ_GLOBAL_VAR_OUTPUT(params.name, varValue)
      )
    }
  ],
  messages: [
    ChatMessageBuilder.functionCall(FN_NAME, params),
    ChatMessageBuilder.system(READ_GLOBAL_VAR_MESSAGE(params.name, varValue))
  ]
});
const VAR_NOT_FOUND_ERROR = (params: FuncParameters): AgentFunctionResult => ({
  outputs: [
    {
      type: "success",
      title: `Failed to read '${params.name}' variable.`, 
      content: FUNCTION_CALL_FAILED(params, FN_NAME, `Global variable {{${params.name}}} not found.`)
    }
  ],
  messages: [
    ChatMessageBuilder.functionCall(FN_NAME, params),
    ChatMessageBuilder.system(FUNCTION_CALL_FAILED(params, FN_NAME, `Global variable {{${params.name}}} not found.`))
  ]
});

export const READ_GLOBAL_VAR_OUTPUT = (varName: string, value: string | undefined) => {
  if (!value || value === "\"undefined\"") {
    return `## Variable {{${varName}}} is undefined`;
  } else if (value.length > 3000) {
    return `## Read variable {{${varName}}}, but it is too large, JSON preview:\n\`\`\`\n${trimText(value, 3000)}\n\`\`\``;
  } else {
    return `## Read variable {{${varName}}}, JSON:\n\`\`\`\n${value}\n\`\`\``;
  }
};
export const READ_GLOBAL_VAR_MESSAGE = (varName: string, value: string | undefined) => {
  if (!value || value === "\"undefined\"") {
    return `Variable {{${varName}}} is undefined`;
  } else if (value.length > 3000) {
    return `Read variable {{${varName}}}, but it is too large, JSON preview:\n\`\`\`\n${trimText(value, 3000)}\n\`\`\``;
  } else {
    return `Read variable {{${varName}}}, JSON:\n\`\`\`\n${value}\n\`\`\``;
  }
};

export const readVar: AgentFunction<AgentContext> = {
  definition: {
    name: "readVar",
    description: `Read the content of a stored global variable.`,
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name of the variable"
        }
      },
      required: ["name"],
      additionalProperties: false
    },
  },
  buildExecutor(context: AgentContext) {
    return async (params: FuncParameters): Promise<Result<AgentFunctionResult, string>> => {
      if (!context.globals[params.name]) {
        return ResultOk(VAR_NOT_FOUND_ERROR(params));
      } 

      return ResultOk(SUCCESS(params, context.globals[params.name]));
    };
  }
};

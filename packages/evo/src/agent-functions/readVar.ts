import { Result, ResultOk } from "@polywrap/result";
import { AgentFunction, AgentFunctionResult } from "@evo-ninja/agent-utils";
import { AgentContext } from "../AgentContext";
import { FUNCTION_CALL_FAILED, READ_GLOBAL_VAR_OUTPUT } from "../prompts";

const FN_NAME = "readVar";
type FuncParameters = { 
  name: string 
};

const SUCCESS = (params: FuncParameters, varValue: string): AgentFunctionResult => ({
  outputs: [
    {
      type: "success",
      title: READ_VAR_TITLE(params),
      content: READ_VAR_CONTENT(params, JSON.stringify(params, null, 2), varValue)
    }
  ],
  messages: [
    {
      role: "assistant",
      content: "",
      function_call: {
        name: FN_NAME,
        arguments: JSON.stringify(params)
      },
    },
    {
      role: "system",
      content: READ_VAR_CONTENT(params, JSON.stringify(params, null, 2), varValue)
    },
  ]
});
const VAR_NOT_FOUND_ERROR = (params: FuncParameters): AgentFunctionResult => ({
  outputs: [
    {
      type: "success",
      title: FAILED_TO_READ_VAR_TITLE(params), 
      content: FAILED_TO_READ_VAR_CONTENT(params)
    }
  ],
  messages: [
    {
      role: "assistant",
      content: "",
      function_call: {
        name: FN_NAME,
        arguments: JSON.stringify(params)
      },
    },
    {
      role: "system",
      content: FAILED_TO_READ_VAR_CONTENT(params)
    },
  ]
});
const READ_VAR_TITLE = (params: FuncParameters) => 
  `Read '${params.name}' variable.`;
const READ_VAR_CONTENT = (
  params: FuncParameters,
  argsStr: string,
  value: string
) => 
  `## Function Call:\n\`\`\`javascript\n${FN_NAME}(${argsStr})\n\`\`\`\n` +
  `## Result\n\`\`\`\n${
    READ_GLOBAL_VAR_OUTPUT(params.name, value)
  }\n\`\`\``;
const FAILED_TO_READ_VAR_TITLE = (params: FuncParameters) => 
  `Failed to read '${params.name}' variable.`;
const FAILED_TO_READ_VAR_CONTENT = (params: FuncParameters) => 
  FUNCTION_CALL_FAILED(FN_NAME, `Global variable ${params.name} not found.`, params);

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

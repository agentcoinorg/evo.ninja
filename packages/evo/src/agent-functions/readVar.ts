import { ResultOk } from "@polywrap/result";
import { AgentFunction, AgentFunctionResult, BasicAgentMessage } from "@evo-ninja/agent-utils";
import { AgentContext } from "../AgentContext";
import { FUNCTION_CALL_FAILED, READ_GLOBAL_VAR_OUTPUT } from "../prompts";

const FN_NAME = "readVar";

const READ_VAR_TITLE = (params: FuncParameters) => 
  `Read '${params.name}' variable.`;
const READ_VAR_CONTENT = (
  params: FuncParameters,
  argsStr: string,
  value: string
) => 
  `# Function Call:\n\`\`\`javascript\n${FN_NAME}(${argsStr})\n\`\`\`\n` +
  `## Result\n\`\`\`\n${
    READ_GLOBAL_VAR_OUTPUT(params.name, value)
  }\n\`\`\``;
const FAILED_TO_READ_VAR_TITLE = (params: FuncParameters) => 
  `Failed to read '${params.name}' variable.`;
const FAILED_TO_READ_VAR_CONTENT = (params: FuncParameters) => 
  FUNCTION_CALL_FAILED(FN_NAME, `Global variable ${params.name} not found.`, params);

type FuncParameters = { 
  name: string 
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
    return async (params: FuncParameters): Promise<AgentFunctionResult> => {
      const argsStr = JSON.stringify(params, null, 2);
     
      if (!context.globals[params.name]) {
        return ResultOk([
          BasicAgentMessage.error(
            "system", 
            FAILED_TO_READ_VAR_TITLE(params), 
            FAILED_TO_READ_VAR_CONTENT(params)
          )
        ]);
      } 

      return ResultOk([
        BasicAgentMessage.ok(
          "system",
          READ_VAR_TITLE(params),
          READ_VAR_CONTENT(params, argsStr, context.globals[params.name])
        )
      ]);
    };
  }
};

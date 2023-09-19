import { ResultErr, ResultOk } from "@polywrap/result";
import { AgentFunction, AgentFunctionResult, AgentChatMessage } from "@evo-ninja/agent-utils";
import { AgentContext } from "../AgentContext";
import { READ_GLOBAL_VAR_OUTPUT, FUNCTION_CALL_FAILED } from "../prompts";

const FN_NAME = "readVar";

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
  buildChatMessage(args: any, result: AgentFunctionResult): AgentChatMessage {
    const argsStr = JSON.stringify(args, null, 2);

    return result.ok
      ? {
          type: "success",
          title: `Read '${args.name}' variable.`,
          content: 
            `# Function Call:\n\`\`\`javascript\n${FN_NAME}(${argsStr})\n\`\`\`\n` +
            READ_GLOBAL_VAR_OUTPUT(args.name, result.value),
        }
      : {
          type: "error",
          title: `Failed to read ${args.namespace} variable!`,
          content: FUNCTION_CALL_FAILED(FN_NAME, result.error, args),
        };
  },
  buildExecutor(context: AgentContext) {
    return async (options: { name: string }): Promise<AgentFunctionResult> => {
      if (!context.globals[options.name]) {
        return ResultErr(`Global variable ${options.name} not found.`);
      } 

      return ResultOk(context.globals[options.name]);
    };
  }
};

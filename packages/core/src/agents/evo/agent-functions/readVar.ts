import { ResultErr, ResultOk } from "@polywrap/result";
import { AgentFunction, AgentContext, AgentFunctionResult, AgentChatMessage } from "../../agent-function";
import { FUNCTION_CALL_FAILED, READ_GLOBAL_VAR_OUTPUT } from "../../prompts";

const FN_NAME = "readVar";

export const readVar: AgentFunction = {
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
          title: `Script ${args.namespace} executed successfully!`,
          content: 
            `# Function Call:\n\`\`\`javascript\n${FN_NAME}(${argsStr})\n\`\`\`\n` +
            READ_GLOBAL_VAR_OUTPUT(args.name, result.value),
        }
      : {
          type: "error",
          title: `Script ${args.namespace} failed to execute!`,
          content: FUNCTION_CALL_FAILED(FN_NAME, result.error, args),
        };
  },
  buildExecutor: (
    context: AgentContext
  ) => {
    return async (options: { name: string }) => {
      if (!context.globals[options.name]) {
        return {
          ok: false,
          result: `Global variable {{${options.name}}} not found.`,
        };
      } 

      return {
        ok: true,
        result: context.globals[options.name],
      };
    };
  }
};

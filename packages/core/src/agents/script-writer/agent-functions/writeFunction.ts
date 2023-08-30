import { ResultErr, ResultOk } from "@polywrap/result";
import { AgentFunction, AgentContext, AgentFunctionResult, AgentChatMessage } from "../../agent-function";
import { FUNCTION_CALL_FAILED, OTHER_EXECUTE_FUNCTION_OUTPUT } from "../../prompts";

const FN_NAME = "writeFunction";

export const writeFunction: AgentFunction = {
  definition: {
    name: FN_NAME,
    description: `Writes the function.`,
    parameters: {
      type: "object",
      properties: {
        namespace: {
          type: "string",
          description: "The namespace of the function, e.g. fs.readFile"
        },
        description: {
          type: "string",
          description: "The detailed description of the function."
        },
        arguments: {
          type: "string",
          description: "The arguments of the function. E.g. '{ path: string, encoding: string }'"
        },
        code: {
          type: "string",
          description: "The code of the function."
        }
      },
      required: ["namespace", "description", "arguments", "code"],
      additionalProperties: false
    },
  },
  buildChatMessage(args: any, result: AgentFunctionResult): AgentChatMessage {
    const argsStr = JSON.stringify(args, null, 2);

    return result.ok
      ? {
          type: "success",
          title: `Function ${args.namespace} executed successfully!`,
          content: 
            `# Function Call:\n\`\`\`javascript\n${FN_NAME}(${argsStr})\n\`\`\`\n` +
            OTHER_EXECUTE_FUNCTION_OUTPUT(result.value),
        }
      : {
          type: "error",
          title: `Function ${args.namespace} failed to execute!`,
          content: FUNCTION_CALL_FAILED(FN_NAME, result.error, args),
        };
  },
  buildExecutor: (
    context: AgentContext
  ) => {
    return async (options: { namespace: string, description: string, arguments: string, code: string }) => {
      if (options.namespace.startsWith("agent.")) {
        return {
          ok: false,
          result: `Cannot create a function with namespace ${options.namespace}. Namespaces starting with 'agent.' are reserved.`,
        }
      }

      context.workspace.writeFileSync("index.js", options.code);

      return {
        ok: true,
        result: `Wrote the function ${options.namespace} to the workspace.`,
      };
    };
  }
};

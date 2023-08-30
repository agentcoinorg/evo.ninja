import { ResultOk } from "@polywrap/result";
import { AgentFunction, AgentContext, AgentFunctionResult, AgentChatMessage } from "../../agent-function";
import { FUNCTION_CALL_FAILED, OTHER_EXECUTE_FUNCTION_OUTPUT } from "../../prompts";

const FN_NAME = "findScript";

export const findScript: AgentFunction = {
  definition: {
    name: "findScript",
    description: `Search for an script.`,
    parameters: {
      type: "object",
      properties: {
        namespace: {
          type: "string",
          description: "Partial namespace of the script"
        },
        description: {
          type: "string",
          description: "The detailed description of the arguments and output of the script."
        },
      },
      required: ["namespace", "description"],
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
            OTHER_EXECUTE_FUNCTION_OUTPUT(result.value),
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
    return async (options: { namespace: string, description: string }): Promise<Result<string, any>> => {
      const candidates = context.scripts.searchScripts(
        `${options.namespace} ${options.description}`
      ).slice(0, 5);

      if (candidates.length === 0) {
        return ResultOk(`Found no candidates for script ${options.namespace}. Try creating the script instead.`);
      }

      return ResultOk(
        `Found the following candidates for script: ${options.namespace}:` + 
        `\n--------------\n` + 
        `${candidates.map((c) => `Namespace: ${c.name}\nArguments: ${c.arguments}\nDescription: ${c.description}`).join("\n--------------\n")}` +
        `\n--------------\n`
      );
    };
  }
};

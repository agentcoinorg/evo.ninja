import { ResultOk } from "@polywrap/result";
import { AgentFunction, AgentContext, AgentFunctionResult, AgentChatMessage } from "../../agent-function";
import { FUNCTION_CALL_FAILED, OTHER_EXECUTE_FUNCTION_OUTPUT } from "../../prompts";

const FN_NAME = "think";

export const think: AgentFunction = {
  definition: {
    name: FN_NAME,
    description: `Think.`,
    parameters: {
      type: "object",
      properties: {
        thoughts: {
          type: "string",
          description: "Your current thoughts about the topic."
        },
      },
      required: ["thoughts"],
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
    return async (options: { thoughts: string }) => {
      return { 
        ok: true,
        result: `I think: ${options.thoughts}.`,
      };
    };
  }
};

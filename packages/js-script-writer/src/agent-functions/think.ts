import { ResultOk } from "@polywrap/result";
import { AgentFunction, AgentFunctionResult, BasicAgentChatMessage } from "@evo-ninja/agent-utils";
import { AgentContext } from "../AgentContext";
import { OTHER_EXECUTE_FUNCTION_OUTPUT } from "../prompts";

const FN_NAME = "think";

export const think: AgentFunction<AgentContext> = {
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
  buildExecutor(context: AgentContext) {
    return async (options: { thoughts: string }): Promise<AgentFunctionResult> => {
      return ResultOk([
        BasicAgentChatMessage.ok(
          "system",
          `Thinking...`,
          `## Function Call:\n\`\`\`javascript\n${FN_NAME}\n\`\`\`\n` +
          OTHER_EXECUTE_FUNCTION_OUTPUT(`I think: ${options.thoughts}.`)
        )
      ]);
    };
  }
};

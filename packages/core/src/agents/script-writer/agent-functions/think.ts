import { AgentFunction, AgentContext } from "../../agent-function";

export const think: AgentFunction = {
  definition: {
    name: "think",
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

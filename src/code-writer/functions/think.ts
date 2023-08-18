import { AgentFunction } from "../../functions";
import { WrapClient } from "../../wrap";

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
    globals: Record<string, string>,
    client: WrapClient
  ) => {
    return async (options: { thoughts: string }) => {
      return { 
        ok: true,
        result: `I think: ${options.thoughts}.`,
      };  
    };
  }
};

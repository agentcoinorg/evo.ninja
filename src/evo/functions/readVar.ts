import { AgentFunction } from "../../functions";
import { WrapClient } from "../../wrap";

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
  buildExecutor: (
    globals: Record<string, string>,
    client: WrapClient
  ) => {
    return async (options: { name: string }) => {
      if (!globals[options.name]) {
        return {
          ok: false,
          result: `Global variable {{${options.name}}} not found.`,
        };
      } 
    
      return {
        ok: true,
        result: globals[options.name],
      };
    };
  }
};

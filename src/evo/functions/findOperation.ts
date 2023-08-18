import { AgentFunction, WrapClient, searchOperations } from "../..";

export const findOperation: AgentFunction = {
  definition: {
    name: "findOperation",
    description: `Search for an operation.`,
    parameters: {
      type: "object",
      properties: {
        namespace: {
          type: "string",
          description: "Partial namespace of the operation"
        },
        description: {
          type: "string",
          description: "The detailed description of the arguments and output of the operation."
        },
      },
      required: ["namespace", "description"],
      additionalProperties: false
    },
  },
  buildExecutor: (
    globals: Record<string, string>,
    client: WrapClient
  ) => {
    return async (options: { namespace: string, description: string }) => {
      const candidates = searchOperations(`${options.namespace} ${options.description}`).slice(0, 5);
  
      if (candidates.length === 0) {
        return {
          ok: true,
          result: `Found no candidates for operation ${options.namespace}. Try creating the operation instead.`,
        };
      }
      return {
        ok: true,
        result: `Found the following candidates for operation: ${options.namespace}:` + 
        `\n--------------\n` + 
        `${candidates.map((c) => `Namespace: ${c.name}\nArguments: ${c.arguments}\nDescription: ${c.description}`).join("\n--------------\n")}` +
        `\n--------------\n`,
      };
    };
  }
};

import chalk from "chalk";
import { AgentFunction } from "../../functions";
import { InMemoryWorkspace } from "../../workspaces";
import { WrapClient } from "../../wrap";
import { addOperation } from "../../operations";

export const createOperation: AgentFunction = {
  definition: {
    name: "createOperation",
      description: `Create an operation using JavaScript.`,
      parameters: {
        type: "object",
        properties: {
          namespace: {
            type: "string",
            description: "The namespace of the operation, e.g. fs.readFile"
          },
          description: {
            type: "string",
            description: "The detailed description of the operation."
          },
          arguments: {
            type: "string",
            description: "The arguments of the operation. E.g. '{ path: string, encoding: string }'. Use only what you need, no optional arguments."
          },
          developerNote: {
            type: "string",
            description: "A note for the developer of the operation, if any."
          }
        },
        required: ["namespace", "description", "arguments"],
        additionalProperties: false
      },
  },
  buildExecutor: (
    globals: Record<string, string>,
    client: WrapClient
  ) => {
    return async (options: { namespace: string, description: string, arguments: string, developerNote?: string }) => {
      if (options.namespace.startsWith("agent.")) {
        return {
          ok: false,
          result: `Cannot create an operation with namespace ${options.namespace}. Try searching for operations in that namespace instead.`,
        }
      }
      
      // Get generated code
      const index = "";
  
      const op = {
        name: options.namespace,
        description: options.description,
        arguments: options.arguments,
        code: index
      };
      addOperation(options.namespace, op);
  
      const candidates = [
       op
      ];
  
      return {
        ok: true,
        result: `Created the following operations:` + 
        `\n--------------\n` + 
        `${candidates.map((c) => `Namespace: ${c.name}\nArguments: ${c.arguments}\nDescription: ${c.description}`).join("\n--------------\n")}` +
        `\n--------------\n`,
      };
    };
  }
};

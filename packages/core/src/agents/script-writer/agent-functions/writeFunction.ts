import { Result, ResultErr, ResultOk } from "@polywrap/result";
import { AgentFunction, AgentContext } from "../../agent-function";

export const writeFunction: AgentFunction = {
  definition: {
    name: "writeFunction",
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
  buildExecutor: (
    context: AgentContext
  ) => {
    return async (options: { namespace: string, description: string, arguments: string, code: string }): Promise<Result<string, any>> => {
      if (options.namespace.startsWith("agent.")) {
        return ResultErr(`Cannot create a function with namespace ${options.namespace}. Namespaces starting with 'agent.' are reserved.`);
      }

      context.workspace.writeFileSync("index.js", options.code);

      return ResultOk(`Wrote the function ${options.namespace} to the workspace.`);
    };
  }
};

import { Result, ResultOk } from "@polywrap/result";
import { AgentFunction, AgentContext } from "../../agent-function";

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

import { Result, ResultErr, ResultOk } from "@polywrap/result";
import { AgentFunction, AgentContext } from "../../agent-function";

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
    context: AgentContext
  ) => {
    return async (options: { name: string }): Promise<Result<string, any>> => {
      if (!context.globals[options.name]) {
        return ResultErr(`Global variable ${options.name} not found.`);
      } 

      return ResultOk(context.globals[options.name]);
    };
  }
};

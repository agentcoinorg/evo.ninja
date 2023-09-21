import { AgentContext } from "../AgentContext";
import { FUNCTION_CALL_FAILED } from "../prompts";

import { AgentFunction, AgentFunctionResult, BasicAgentMessage } from "@evo-ninja/agent-utils";
import { ResultOk } from "@polywrap/result";

const allowedLibs = [
  "fs",
  "axios",
  "util"
];

const FN_NAME = "writeFunction";

type FuncParameters = { 
  namespace: string, 
  description: string, 
  arguments: string, 
  code: string 
};

export const writeFunction: AgentFunction<AgentContext> = {
  definition: {
    name: FN_NAME,
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
  buildExecutor(context: AgentContext) {
    return async (params: FuncParameters): Promise<AgentFunctionResult> => {
      if (params.namespace.startsWith("agent.")) {
        return ResultOk([
          BasicAgentMessage.error(
            "system", 
            `Failed to write function '${params.namespace}'!`,
            FUNCTION_CALL_FAILED(FN_NAME, `Cannot create a function with namespace ${params.namespace}. Namespaces starting with 'agent.' are reserved.`, params)
          )
        ]);
      }

      if (extractRequires(params.code).some(x => !allowedLibs.includes(x))) {
        return ResultOk([BasicAgentMessage.error("system", `Cannot require libraries other than ${allowedLibs.join(", ")}.`)])
      }

      context.workspace.writeFileSync("index.js", params.code);

      return ResultOk([
        BasicAgentMessage.ok(
          "system",
          `Wrote function '${params.namespace}'.`,
          `Wrote the function ${params.namespace} to the workspace.`,
          FN_NAME
        )
      ]);
    };
  }
};

const extractRequires = (code: string) => {
  // This regex specifically matches the 'require' keyword by using word boundaries (\b)
  // It also accounts for possible whitespaces before or after the quotes.
  const regex = /\brequire\b\s*\(\s*["']([^"']+)["']\s*\)/g;

  let match;
  const libraries = [];

  // Use exec() in a loop to capture all occurrences
  while ((match = regex.exec(code)) !== null) {
    // match[1] contains the captured group with the library name
    libraries.push(match[1]);
  }

  return libraries;
};

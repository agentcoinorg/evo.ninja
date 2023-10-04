import { AgentContext } from "../AgentContext";
import { FUNCTION_CALL_FAILED } from "../prompts";

import { AgentFunction, AgentFunctionResult, AgentOutputType, ChatMessageBuilder } from "@evo-ninja/agent-utils";
import { Result, ResultOk } from "@polywrap/result";

const allowedLibs = [
  "fs",
  "axios",
  "util",
  "path"
];

export function formatSupportedLibraries() {
  const [last] = allowedLibs.slice(-1);
  const others = allowedLibs.slice(0, -1);
  return others.length ? `"${others.join('", "')}", and "${last}"` : `"${last}"`;
}

const FN_NAME = "writeFunction";
type FuncParameters = { 
  namespace: string, 
  description: string, 
  arguments: string, 
  code: string 
};

const SUCCESS = (params: FuncParameters): AgentFunctionResult => ({
  outputs: [
    {
      type: AgentOutputType.Success,
      title: `Wrote function '${params.namespace}'.`,
      content: `Wrote the function ${params.namespace} to the workspace.`
    }
  ],
  messages: [
    ChatMessageBuilder.functionCall(FN_NAME, params),
    ChatMessageBuilder.system(`Success.`),
  ]
});
const CANNOT_CREATE_IN_AGENT_NAMESPACE_ERROR = (params: FuncParameters): AgentFunctionResult => ({
  outputs: [
    {
      type: AgentOutputType.Error,
      title: `Failed to write function '${params.namespace}'!`,
      content: FUNCTION_CALL_FAILED(FN_NAME, `Cannot create a function with namespace ${params.namespace}. Namespaces starting with 'agent.' are reserved.`, params)
    }
  ],
  messages: [
    ChatMessageBuilder.functionCall(FN_NAME, params),
    ChatMessageBuilder.system(
      `Failed writing the function.\n` +
      `Namespaces starting with 'agent.' are reserved.`
    ),
  ]
});
const CANNOT_REQUIRE_LIB_ERROR = (params: FuncParameters): AgentFunctionResult => ({
  outputs: [
    {
      type: AgentOutputType.Error,
      title:`Failed to write function '${params.namespace}'!`,
      content: FUNCTION_CALL_FAILED(FN_NAME,  `Cannot require libraries other than ${allowedLibs.join(", ")}.`, params)
    }
  ],
  messages: [
    ChatMessageBuilder.functionCall(FN_NAME, params),
    ChatMessageBuilder.system(`Cannot require libraries other than ${allowedLibs.join(", ")}.`),
  ]
});

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
  buildExecutor(context) {
    return async (params: FuncParameters): Promise<Result<AgentFunctionResult, string>> => {
      if (params.namespace.startsWith("agent.")) {
        return ResultOk(CANNOT_CREATE_IN_AGENT_NAMESPACE_ERROR(params));
      }

      if (extractRequires(params.code).some(x => !allowedLibs.includes(x))) {
        return ResultOk(CANNOT_REQUIRE_LIB_ERROR(params));
      }

      context.workspace.writeFileSync("index.js", params.code);

      return ResultOk(SUCCESS(params));
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

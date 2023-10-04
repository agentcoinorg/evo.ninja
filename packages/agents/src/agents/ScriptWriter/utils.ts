import { AgentFunctionResult, AgentOutputType, ChatMessageBuilder, trimText } from "@evo-ninja/agent-utils";

export interface ThinkFuncParameters { 
  thoughts: string
};

export interface WriteFuncParameters { 
  namespace: string, 
  description: string, 
  arguments: string, 
  code: string 
};

export const ALLOWED_LIBS = [
  "fs",
  "axios",
  "util",
  "path"
];

export const extractRequires = (code: string) => {
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

export function formatSupportedLibraries() {
  const [last] = ALLOWED_LIBS.slice(-1);
  const others = ALLOWED_LIBS.slice(0, -1);
  return others.length ? `"${others.join('", "')}", and "${last}"` : `"${last}"`;
}

export const FUNCTION_CALL_FAILED = (name: string, error: string, args: any) =>
  `The function '${name}' failed, this is the error:\n\`\`\`\n${
    error && typeof error === "string"
      ? trimText(error, 300)
      : "Unknown error."
    }\n\`\`\`\n\nArguments:\n\`\`\`\n${JSON.stringify(args, null, 2)}\n\`\`\``;

export const CANNOT_CREATE_IN_AGENT_NAMESPACE_ERROR = (functionName: string, params: WriteFuncParameters): AgentFunctionResult => ({
  outputs: [
    {
      type: AgentOutputType.Error,
      title: `Failed to write function '${params.namespace}'!`,
      content: FUNCTION_CALL_FAILED(functionName, `Cannot create a function with namespace ${params.namespace}. Namespaces starting with 'agent.' are reserved.`, params)
    }
  ],
  messages: [
    ChatMessageBuilder.functionCall(functionName, params),
    ChatMessageBuilder.system(
      `Failed writing the function.\n` +
      `Namespaces starting with 'agent.' are reserved.`
    ),
  ]
});
export const CANNOT_REQUIRE_LIB_ERROR = (functionName: string, params: WriteFuncParameters): AgentFunctionResult => ({
  outputs: [
    {
      type: AgentOutputType.Error,
      title:`Failed to write function '${params.namespace}'!`,
      content: FUNCTION_CALL_FAILED(functionName,  `Cannot require libraries other than ${ALLOWED_LIBS.join(", ")}.`, params)
    }
  ],
  messages: [
    ChatMessageBuilder.functionCall(functionName, params),
    ChatMessageBuilder.system(`Cannot require libraries other than ${ALLOWED_LIBS.join(", ")}.`),
  ]
});
import { Result, ResultOk } from "@polywrap/result";
import { AgentFunctionResult, AgentOutputType, ChatMessageBuilder } from "@evo-ninja/agent-utils";
import { BaseAgentConfig, BaseAgentContext } from "../../BaseAgent";
import { ALLOWED_LIBS, CANNOT_CREATE_IN_AGENT_NAMESPACE_ERROR, CANNOT_REQUIRE_LIB_ERROR, ThinkFuncParameters, WriteFuncParameters, extractRequires, formatSupportedLibraries } from "./utils";

export interface ScriptWriterRunArgs {
  namespace: string;
  description: string;
  args: string;
}

export interface ScriptWriterContext extends BaseAgentContext {}

const WRITE_FN_NAME = "writeFunction";
const WRITE_SUCCESS = (params: WriteFuncParameters) => ({
  outputs: [
    {
      type: AgentOutputType.Success,
      title: `Wrote function '${params.namespace}'.`,
      content: `Wrote the function ${params.namespace} to the workspace.`
    }
  ],
  messages: [
    ChatMessageBuilder.functionCall(WRITE_FN_NAME, params),
    ChatMessageBuilder.system(`Success.`),
  ]
})

const THINK_FN_NAME = "think";
const THINK_SUCCESS = (params: ThinkFuncParameters) => ({
  outputs: [
    {
      type: AgentOutputType.Success,
      title: `Thinking...`,
      content: 
        `## Thoughts:\n` +
        `\`\`\`\n` +
        `${params.thoughts}\n` +
        `\`\`\``
    }
  ],
  messages: [
    ChatMessageBuilder.functionCall(THINK_FN_NAME, params),
  ]
})

export const SCRIPTWRITER_AGENT_CONFIG: BaseAgentConfig<ScriptWriterRunArgs, ScriptWriterContext> = {
  name: 'ScriptWriter',
  initialMessages: (_, {
    namespace,
    description,
    args
  }) => [
    {
      role: "assistant",
      content: `You are an agent that writes JavaScript functions.\n` +
      `Before writing any code think step by step about what you want to implement.\n` +
      `Call the writeFunction function to submit the code of your JavaScript function.\n` +
      `If the first try doesn't succeed, try again. Do not create mock functionality.\n`
    },
    {
      role: "user", content:  `Your task is to write the body of an async JavaScript function.\nFunction namepace: "${namespace}"\nArguments: ${args}.\nDescription: "${description}"\n` +
      `You must refer to function arguments as if they were locally defined variables, remember you're writing just the body of the function.\n` +
      `Use only the function arguments above, do not add new ones.\n` +
      `Since you are writing the body of the function, remember to use the return keyword if needed.\n` +
      `When using libraries, use the require function to import them.\n` +
      `Do not require libraries aside from ${formatSupportedLibraries()}'\n` +
      `Do not use external APIs that require authentication or an API key.\n` +
      `Do not recursively call the "${namespace}" function.\n` +
      `Example function body:\n` +
      `const fs = require('fs');\n` +
      `return fs.readFileSync(path, encoding);\n`
    }
  ],
  loopPreventionPrompt: "Assistant, try executing the writeFunction.",
  functions: {
    [THINK_FN_NAME]: {
      definition: {
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
        success: (_, __, params) => THINK_SUCCESS(params as ThinkFuncParameters),
      },
      buildExecutor: (_) => {
        return async (params: ThinkFuncParameters): Promise<Result<AgentFunctionResult, string>> => {
          return ResultOk(THINK_SUCCESS(params));
        };
      }
    },
    [WRITE_FN_NAME]: {
      definition: {
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
        success: (_, __, params) => WRITE_SUCCESS(params as WriteFuncParameters),
      },
      buildExecutor: (context) => {
        return async (params: { 
          namespace: string, 
          description: string, 
          arguments: string, 
          code: string 
        }): Promise<Result<AgentFunctionResult, string>> => {
          if (params.namespace.startsWith("agent.")) {
            return ResultOk(CANNOT_CREATE_IN_AGENT_NAMESPACE_ERROR(WRITE_FN_NAME, params));
          }
    
          if (extractRequires(params.code).some(x => !ALLOWED_LIBS.includes(x))) {
            return ResultOk(CANNOT_REQUIRE_LIB_ERROR(WRITE_FN_NAME, params));
          }
    
          context.workspace.writeFileSync("index.js", params.code);
    
          return ResultOk(WRITE_SUCCESS(params));
        };
      }
    }
  },
  shouldTerminate: (functionCalled) => functionCalled.name === "writeFunction"
}

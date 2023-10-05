import { Agent, AgentFunctionResult, AgentOutputType, ChatMessageBuilder, trimText } from "@evo-ninja/agent-utils";
import { Result, ResultOk } from "@polywrap/result";
import { AgentFunctionBase, HandlerResult } from "../AgentFunctionBase";
import { AgentBaseContext } from "../AgentBase";
import { extractRequires } from "../utils";

interface WriteFunctionFuncParameters { 
  namespace: string, 
  description: string, 
  arguments: string, 
  code: string 
};

export class WriteFunctionFunction extends AgentFunctionBase<AgentBaseContext, WriteFunctionFuncParameters> {
  static allowedLibs =
    [
      "fs",
      "axios",
      "util",
      "path"
    ]

  get name(): string {
    return "writeFunction";
  }
  get description(): string {
    return `Writes the function.`;
  }
  get parameters(): any {
    return {
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
    }
  }

  buildExecutor(agent: Agent<unknown>, context: AgentBaseContext): (params: WriteFunctionFuncParameters) => Promise<Result<AgentFunctionResult, string>> {
    return async (params: { 
      namespace: string, 
      description: string, 
      arguments: string, 
      code: string 
    }): Promise<Result<AgentFunctionResult, string>> => {
      if (params.namespace.startsWith("agent.")) {
        return ResultOk(this.cannotCreateInAgentNamespaceError(this.name, params));
      }

      if (extractRequires(params.code).some(x => !WriteFunctionFunction.allowedLibs.includes(x))) {
        return ResultOk(this.cannotRequireLibError(this.name, params));
      }

      context.workspace.writeFileSync("index.js", params.code);

      return ResultOk(this.onSuccess(params));
    };
  }

  private onSuccess(params: WriteFunctionFuncParameters): HandlerResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `Wrote function '${params.namespace}'.`,
          content: `Wrote the function ${params.namespace} to the workspace.`
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, params),
        ChatMessageBuilder.functionCallResult(this.name, "Success."),
      ]
    }
  }

  private onError (name: string, error: string, args: any) {
    return `The function '${name}' failed, this is the error:\n\`\`\`\n${
      error && typeof error === "string"
        ? trimText(error, 300)
        : "Unknown error."
      }\n\`\`\`\n\nArguments:\n\`\`\`\n${JSON.stringify(args, null, 2)}\n\`\`\``;
  }

  private cannotCreateInAgentNamespaceError(functionName: string, params: WriteFunctionFuncParameters) {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `Failed to write function '${params.namespace}'!`,
          content: this.onError(functionName, `Cannot create a function with namespace ${params.namespace}. Namespaces starting with 'agent.' are reserved.`, params)
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(functionName, params),
        ChatMessageBuilder.functionCallResult(
          functionName,
          `Failed writing the function.\n` +
          `Namespaces starting with 'agent.' are reserved.`
        ),
      ]
    }
  }

  private cannotRequireLibError(functionName: string, params: WriteFunctionFuncParameters) {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title:`Failed to write function '${params.namespace}'!`,
          content: this.onError(functionName,  `Cannot require libraries other than ${WriteFunctionFunction.allowedLibs.join(", ")}.`, params)
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(functionName, params),
        ChatMessageBuilder.functionCallResult(
          functionName,
          `Cannot require libraries other than ${WriteFunctionFunction.allowedLibs.join(", ")}.`
        ),
      ]
    }
  }

  static formatSupportedLibraries() {
    const [last] = this.allowedLibs.slice(-1);
    const others = this.allowedLibs.slice(0, -1);
    return others.length ? `"${others.join('", "')}", and "${last}"` : `"${last}"`;
  }
}

import { AgentFunctionResult, AgentOutputType, AgentVariables, ChatMessageBuilder, trimText } from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../AgentFunctionBase";
import { Agent } from "../Agent";

interface WriteScriptFuncParameters { 
  namespace: string, 
  description: string, 
  arguments: string, 
  code: string 
}

export class WriteScriptFunction extends AgentFunctionBase<WriteScriptFuncParameters> {
  static allowedLibs =
    [
      "fs",
      "axios",
      "util",
      "path"
    ];

  name: string = "writeScript";
  description: string = `Writes the function.`;
  parameters: any = {
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
  };

  buildExecutor({ context }: Agent<unknown>): (params: WriteScriptFuncParameters, rawParams?: string) => Promise<AgentFunctionResult> {
    return async (
      params: {
        namespace: string,
        description: string,
        arguments: string,
        code: string
      },
      rawParams?: string
    ): Promise<AgentFunctionResult> => {
      if (params.namespace.startsWith("agent.")) {
        return this.onErrorCannotCreateInAgentNamespace(this.name, params, rawParams, context.variables);
      }

      if (this.extractRequires(params.code).some(x => !WriteScriptFunction.allowedLibs.includes(x))) {
        return this.onErrorCannotRequireLib(this.name, params, rawParams, context.variables);
      }

      context.workspace.writeFileSync("index.js", params.code);

      return this.onSuccess(params, rawParams, context.variables);
    };
  }

  private onSuccess(params: WriteScriptFuncParameters, rawParams: string | undefined, variables: AgentVariables): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `Wrote function '${params.namespace}'.`,
          content: `Wrote the function ${params.namespace} to the workspace.`
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ...ChatMessageBuilder.functionCallResultWithVariables(this.name, "Success.", variables),
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

  private extractRequires = (code: string) => {
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
  }

  private onErrorCannotCreateInAgentNamespace(functionName: string, params: WriteScriptFuncParameters, rawParams: string | undefined, variables: AgentVariables) {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `Failed to write function '${params.namespace}'!`,
          content: this.onError(functionName, `Cannot create a function with namespace ${params.namespace}. Namespaces starting with 'agent.' are reserved.`, params)
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(functionName, rawParams),
        ...ChatMessageBuilder.functionCallResultWithVariables(
          functionName,
          `Failed writing the function.\n` +
          `Namespaces starting with 'agent.' are reserved.`,
          variables
        ),
      ]
    }
  }

  private onErrorCannotRequireLib(functionName: string, params: WriteScriptFuncParameters, rawParams: string | undefined, variables: AgentVariables) {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title:`Failed to write function '${params.namespace}'!`,
          content: this.onError(functionName,  `Cannot require libraries other than ${WriteScriptFunction.allowedLibs.join(", ")}.`, params)
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(functionName, rawParams),
        ...ChatMessageBuilder.functionCallResultWithVariables(
          functionName,
          `Cannot require libraries other than ${WriteScriptFunction.allowedLibs.join(", ")}.`,
          variables
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

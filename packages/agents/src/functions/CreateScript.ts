import { AgentFunctionResult, AgentOutputType, ChatMessageBuilder } from "@/agent-core";
import { FUNCTION_CALL_FAILED, FUNCTION_CALL_SUCCESS_CONTENT } from "../agents/Scripter/utils";
import { createScriptWriter } from "../agents/ScriptWriter/utils";
import { LlmAgentFunctionBase } from "./utils";
import { Agent } from "../agents/utils";
import { Script } from "@evo-ninja/agent-utils";

interface CreateScriptFuncParameters { 
  namespace: string;
  description: string;
  arguments: string;
}

export class CreateScriptFunction extends LlmAgentFunctionBase<CreateScriptFuncParameters> {
  name: string = "createScript";
  description: string = `Create a script using JavaScript.`;
  parameters: any = {
    type: "object",
    properties: {
      namespace: {
        type: "string",
        description: "The namespace of the script, e.g. fs.readFile"
      },
      description: {
        type: "string",
        description: "The detailed description of the script."
      },
      arguments: {
        type: "string",
        description: "The arguments of the script. E.g. '{ path: string, encoding: string }'. Use only what you need, no optional arguments."
      },
    },
    required: ["namespace", "description", "arguments"],
    additionalProperties: false
  };

  buildExecutor({ context }: Agent<unknown>): (params: CreateScriptFuncParameters, rawParams?: string) => Promise<AgentFunctionResult> {
    return async (params: CreateScriptFuncParameters, rawParams?: string): Promise<AgentFunctionResult> => {
      if (params.namespace.startsWith("agent.")) {
        return this.onErrorCannotCreateScriptsOnAgentNamespace(params, rawParams);
      }
      context.logger.notice(`Creating script '${params.namespace}'...`);

      const writer = createScriptWriter(context);

      const result = await this.askAgent(
        writer, 
        {
          namespace: params.namespace,
          description: params.description,
          args: params.arguments
        },
        context
      );

      if (!result.ok) {
        return this.onErrorCreateScript(params, rawParams, result.error?.toString() || "Unknown error");
      }

      const index = writer.workspace.readFileSync("index.js");

      const script = {
        name: params.namespace,
        description: params.description,
        arguments: params.arguments,
        code: index
      };
      context.scripts.addScript(params.namespace, script);

      return this.onSuccess(script, params, rawParams);
    };
  }

  private onSuccess(script: Script, params: CreateScriptFuncParameters, rawParams: string | undefined): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title:`Created '${params.namespace}' script.`,
          content: FUNCTION_CALL_SUCCESS_CONTENT(
            this.name,
            params, 
            `Created the following script:` + 
            `\n--------------\n` + 
            `Namespace: ${script.name}\nArguments: ${script.arguments}\nDescription: ${script.description}` +
            `\n--------------\n`
          )
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ChatMessageBuilder.functionCallResult(this.name, `Script '${script.name}' created.`)
      ]
    }
  }

  private onErrorCannotCreateScriptsOnAgentNamespace(params: CreateScriptFuncParameters,  rawParams: string | undefined) {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `Failed to create '${params.namespace}' script!`,
          content: FUNCTION_CALL_FAILED(
            params, 
            this.name, 
            `Scripts in the 'agent' namespace cannot be created. Try searching for an existing script instead.`
          )
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ChatMessageBuilder.functionCallResult(
          this.name,
          `Error: Scripts in the 'agent' namespace cannot be created. Try searching for an existing script instead.`
        )
      ]
    }
  }

  private onErrorCreateScript(params: CreateScriptFuncParameters, rawParams: string | undefined, error: string) {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `Failed to create '${params.namespace}' script!`,
          content: FUNCTION_CALL_FAILED(
            params, 
            this.name, 
            `Error trying to create the script: ${error}.`
          )
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ChatMessageBuilder.functionCallResult(
          this.name,
          `Error trying to create the script: ${error}.`
        )
      ]
    }
  }
}

import { Agent, AgentFunctionResult, AgentOutputType, ChatMessageBuilder, Script } from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../../../AgentFunctionBase";
import { ScripterContext } from "../config";
import { FUNCTION_CALL_FAILED, FUNCTION_CALL_SUCCESS_CONTENT, createScriptWriter } from "../utils";

interface CreateScriptFuncParameters { 
  namespace: string, 
  description: string, 
  arguments: string 
}

export class CreateScriptFunction extends AgentFunctionBase<ScripterContext, CreateScriptFuncParameters> {
  get name(): string {
    return "createScript";
  }
  get description(): string {
    return `Create a script using JavaScript.`;
  }
  get parameters() {
    return {
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
    }
  }

  buildExecutor(agent: Agent<unknown>, context: ScripterContext): (params: CreateScriptFuncParameters) => Promise<AgentFunctionResult> {
    return async (params: CreateScriptFuncParameters): Promise<AgentFunctionResult> => {
      if (params.namespace.startsWith("agent.")) {
        return this.onErrorCannotCreateScriptsOnAgentNamespace(params);
      }

      // Create a fresh ScriptWriter agent
      const writer = createScriptWriter({
        llm: context.llm,
        chat: context.chat,
        logger: context.logger,
        env: context.env,
      });

      context.logger.notice(`Creating script '${params.namespace}'...`);

      let iterator = writer.run({
        namespace: params.namespace,
        description: params.description,
        args: params.arguments
      });

      while(true) {
        const response = await iterator.next();

        if (response.done) {
          if (!response.value.ok) {
            return this.onErrorCreateScript(params, response.value.error?.toString() || "Unknown error");
          }
          break;
        }

        response.value && context.logger.info(response.value.title);

        // TODO: we should not be communicating the ScriptWriter's completion
        //       via a special file in the workspace
        if (writer.workspace.existsSync("index.js")) {
          break;
        }
      }

      const index = writer.workspace.readFileSync("index.js");

      const script = {
        name: params.namespace,
        description: params.description,
        arguments: params.arguments,
        code: index
      };
      context.scripts.addScript(params.namespace, script);
      
      return this.onSuccess(script, params);
    };
  }

  private onSuccess(script: Script, params: CreateScriptFuncParameters): AgentFunctionResult {
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
        ChatMessageBuilder.functionCall(this.name, params),
        ChatMessageBuilder.functionCallResult(this.name, `Script '${script.name}' created.`)
      ]
    }
  }

  private onErrorCannotCreateScriptsOnAgentNamespace(params: CreateScriptFuncParameters) {
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
        ChatMessageBuilder.functionCall(this.name, params),
        ChatMessageBuilder.functionCallResult(
          this.name,
          `Error: Scripts in the 'agent' namespace cannot be created. Try searching for an existing script instead.`
        )
      ]
    }
  }

  private onErrorCreateScript(params: CreateScriptFuncParameters, error: string) {
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
        ChatMessageBuilder.functionCall(this.name, params),
        ChatMessageBuilder.functionCallResult(
          this.name,
          `Error trying to create the script: ${error}.`
        )
      ]
    }
  }
}

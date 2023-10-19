import { Agent, AgentFunctionResult, AgentOutputType, AgentVariables, ChatMessageBuilder, Script, Scripts } from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../AgentFunctionBase";
import { FUNCTION_CALL_FAILED, FUNCTION_CALL_SUCCESS_CONTENT } from "../agents/Scripter/utils";
import { createScriptWriter } from "../agents/ScriptWriter/utils";
import { AgentBaseContext } from "../AgentBase";

interface CreateScriptFuncParameters { 
  namespace: string;
  description: string;
  arguments: string;
}

export class CreateScriptFunction extends AgentFunctionBase<CreateScriptFuncParameters> {
  constructor(private scripts: Scripts) {
    super();
  }

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

  buildExecutor(agent: Agent<unknown>, context: AgentBaseContext): (params: CreateScriptFuncParameters, rawParams?: string) => Promise<AgentFunctionResult> {
    return async (params: CreateScriptFuncParameters, rawParams?: string): Promise<AgentFunctionResult> => {
      if (params.namespace.startsWith("agent.")) {
        return this.onErrorCannotCreateScriptsOnAgentNamespace(params, rawParams, context.variables);
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
            return this.onErrorCreateScript(params, rawParams, response.value.error?.toString() || "Unknown error", context.variables);
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
      this.scripts.addScript(params.namespace, script);
      
      return this.onSuccess(script, params, rawParams, context.variables);
    };
  }

  private onSuccess(script: Script, params: CreateScriptFuncParameters,  rawParams: string | undefined, variables: AgentVariables): AgentFunctionResult {
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
        ...ChatMessageBuilder.functionCallResultWithVariables(this.name, `Script '${script.name}' created.`, variables)
      ]
    }
  }

  private onErrorCannotCreateScriptsOnAgentNamespace(params: CreateScriptFuncParameters,  rawParams: string | undefined, variables: AgentVariables) {
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
        ...ChatMessageBuilder.functionCallResultWithVariables(
          this.name,
          `Error: Scripts in the 'agent' namespace cannot be created. Try searching for an existing script instead.`,
          variables
        )
      ]
    }
  }

  private onErrorCreateScript(params: CreateScriptFuncParameters, rawParams: string | undefined, error: string, variables: AgentVariables) {
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
        ...ChatMessageBuilder.functionCallResultWithVariables(
          this.name,
          `Error trying to create the script: ${error}.`,
          variables
        )
      ]
    }
  }
}

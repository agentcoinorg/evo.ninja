import { Result, ResultErr, ResultOk } from "@polywrap/result";
import { Script, AgentFunction, AgentFunctionResult, AgentOutputType, ChatMessageBuilder } from "@evo-ninja/agent-utils";
import { ScriptWriter } from "@evo-ninja/agents";
import { AgentContext } from "../AgentContext";
import { FUNCTION_CALL_FAILED, FUNCTION_CALL_SUCCESS_CONTENT } from "../prompts";

const FN_NAME = "createScript";
type FuncParameters = { 
  namespace: string, 
  description: string, 
  arguments: string 
};

const SUCCESS = (script: Script, params: FuncParameters): AgentFunctionResult => ({
  outputs: [
    {
      type: AgentOutputType.Success,
      title:`Created '${params.namespace}' script.`,
      content: FUNCTION_CALL_SUCCESS_CONTENT(
        FN_NAME,
        params, 
        `Created the following script:` + 
        `\n--------------\n` + 
        `Namespace: ${script.name}\nArguments: ${script.arguments}\nDescription: ${script.description}` +
        `\n--------------\n`
      )
    }
  ],
  messages: [
    ChatMessageBuilder.functionCall(FN_NAME, params),
    ChatMessageBuilder.functionCallResult(FN_NAME, `Script '${script.name}' created.`)
  ]
});

const CANNOT_CREATE_SCRIPTS_ON_AGENT_NAMESPACE = (params: FuncParameters): AgentFunctionResult => ({
  outputs: [
    {
      type: AgentOutputType.Error,
      title: `Failed to create '${params.namespace}' script!`,
      content: FUNCTION_CALL_FAILED(
        params, 
        FN_NAME, 
        `Scripts in the 'agent' namespace cannot be created. Try searching for an existing script instead.`
      )
    }
  ],
  messages: [
    ChatMessageBuilder.functionCall(FN_NAME, params),
    ChatMessageBuilder.functionCallResult(
      FN_NAME,
      `Error: Scripts in the 'agent' namespace cannot be created. Try searching for an existing script instead.`
    )
  ]
});

export function createScript(createScriptWriter: () => ScriptWriter): AgentFunction<AgentContext> {
  return {
    definition: {
      name: "createScript",
        description: `Create a script using JavaScript.`,
        parameters: {
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
        },
    },
    buildExecutor(context: AgentContext) {
      return async (params: FuncParameters): Promise<Result<AgentFunctionResult, string>> => {
        if (params.namespace.startsWith("agent.")) {
          return ResultOk(CANNOT_CREATE_SCRIPTS_ON_AGENT_NAMESPACE(params));
        }

        // Create a fresh ScriptWriter agent
        const writer = createScriptWriter();

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
              return ResultErr(response.value.error);
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
        
        return ResultOk(SUCCESS(script, params));
      };
    }
  };
};

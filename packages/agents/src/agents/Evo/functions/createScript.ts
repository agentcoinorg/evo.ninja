import { Script, AgentFunctionResult, AgentOutputType, ChatMessageBuilder } from "@evo-ninja/agent-utils";
import { FUNCTION_CALL_SUCCESS_CONTENT, FUNCTION_CALL_FAILED, createScriptWriter } from "../utils";
import { AgentFunction } from "../../..";
import { EvoContext } from "../config";

export const CREATE_SCRIPT_FN_NAME = "createScript";
type CREATE_SCRIPT_FN_PARAMS = { 
  namespace: string, 
  description: string, 
  arguments: string 
}
const CREATE_SCRIPT_SUCCESS = (script: Script, params: CREATE_SCRIPT_FN_PARAMS): AgentFunctionResult => ({
  outputs: [
    {
      type: AgentOutputType.Success,
      title:`Created '${params.namespace}' script.`,
      content: FUNCTION_CALL_SUCCESS_CONTENT(
        CREATE_SCRIPT_FN_NAME,
        params, 
        `Created the following script:` + 
        `\n--------------\n` + 
        `Namespace: ${script.name}\nArguments: ${script.arguments}\nDescription: ${script.description}` +
        `\n--------------\n`
      )
    }
  ],
  messages: [
    ChatMessageBuilder.functionCall(CREATE_SCRIPT_FN_NAME, params),
    ChatMessageBuilder.functionCallResult(CREATE_SCRIPT_FN_NAME, `Script '${script.name}' created.`)
  ]
});

const CANNOT_CREATE_SCRIPTS_ON_AGENT_NAMESPACE = (params: CREATE_SCRIPT_FN_PARAMS): AgentFunctionResult => ({
  outputs: [
    {
      type: AgentOutputType.Error,
      title: `Failed to create '${params.namespace}' script!`,
      content: FUNCTION_CALL_FAILED(
        params, 
        CREATE_SCRIPT_FN_NAME, 
        `Scripts in the 'agent' namespace cannot be created. Try searching for an existing script instead.`
      )
    }
  ],
  messages: [
    ChatMessageBuilder.functionCall(CREATE_SCRIPT_FN_NAME, params),
    ChatMessageBuilder.functionCallResult(
      CREATE_SCRIPT_FN_NAME,
      `Error: Scripts in the 'agent' namespace cannot be created. Try searching for an existing script instead.`
    )
  ]
});

const ERROR_ON_CREATE_SCRIPT = (params: CREATE_SCRIPT_FN_PARAMS, error: string): AgentFunctionResult => ({
  outputs: [
    {
      type: AgentOutputType.Error,
      title: `Failed to create '${params.namespace}' script!`,
      content: FUNCTION_CALL_FAILED(
        params, 
        CREATE_SCRIPT_FN_NAME, 
        `Scripts in the 'agent' namespace cannot be created. Try searching for an existing script instead.`
      )
    }
  ],
  messages: [
    ChatMessageBuilder.functionCall(CREATE_SCRIPT_FN_NAME, params),
    ChatMessageBuilder.functionCallResult(
      CREATE_SCRIPT_FN_NAME,
      `Error trying to create the script: ${error}.`
    )
  ]
});

export const createScriptFunction: {
  definition: AgentFunction;
  buildExecutor: (context: EvoContext) => (params: CREATE_SCRIPT_FN_PARAMS) => Promise<AgentFunctionResult>;
} = {
  definition: {
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
  buildExecutor(context: EvoContext) {
    return async (params: CREATE_SCRIPT_FN_PARAMS): Promise<AgentFunctionResult> => {
      if (params.namespace.startsWith("agent.")) {
        return CANNOT_CREATE_SCRIPTS_ON_AGENT_NAMESPACE(params);
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
            return ERROR_ON_CREATE_SCRIPT(params, response.value.error?.toString() || "Unknown error");
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
      
      return CREATE_SCRIPT_SUCCESS(script, params);
    };
  }
}

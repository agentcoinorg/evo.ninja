import { Script, AgentFunctionResult, AgentOutputType, AgentFunctionDefinition, ChatMessageBuilder } from "@evo-ninja/agent-utils";
import { Result, ResultOk } from "@polywrap/result";
import { FUNCTION_CALL_SUCCESS_CONTENT } from "../utils";
import { EvoContext } from "../config";

export const FIND_SCRIPT_FN_NAME = "findScript";
type FIND_SCRIPT_FN_PARAMS = { 
  namespace: string, 
  description: string 
}
const FIND_SCRIPT_SUCCESS = (params: FIND_SCRIPT_FN_PARAMS, candidates: Script[]): AgentFunctionResult => ({
  outputs: [
    {
      type: AgentOutputType.Success,
      title: FIND_SCRIPT_TITLE(params),
      content: FUNCTION_CALL_SUCCESS_CONTENT(
        FIND_SCRIPT_FN_NAME,
        params,
        `Found the following results for script '${params.namespace}'` + 
        `\n--------------\n` + 
        `${candidates.map((c) => `Namespace: ${c.name}\nArguments: ${c.arguments}\nDescription: ${c.description}`).join("\n--------------\n")}\n` +
        `\n--------------\n`
      )
    }
  ],
  messages: [
    ChatMessageBuilder.functionCall(FIND_SCRIPT_FN_NAME, params),
    ChatMessageBuilder.functionCallResult(
      FIND_SCRIPT_FN_NAME,
      `Found the following results for script '${params.namespace}'\n` + 
      `${candidates.map((c) => `Namespace: ${c.name}\nArguments: ${c.arguments}\nDescription: ${c.description}`).join("\n--------------\n")}\n` +
      `\`\`\``
    ),
  ]
});

export const findScriptFunction: {
  definition: AgentFunctionDefinition;
  buildExecutor: (context: EvoContext) => (params: FIND_SCRIPT_FN_PARAMS) => Promise<Result<AgentFunctionResult, string>>;
} = {
  definition: {
    name: FIND_SCRIPT_FN_NAME,
    description: `Search for an script.`,
    parameters: {
      type: "object",
      properties: {
        namespace: {
          type: "string",
          description: "Partial namespace of the script"
        },
        description: {
          type: "string",
          description: "The detailed description of the arguments and output of the script."
        },
      },
      required: ["namespace", "description"],
      additionalProperties: false
    },
  },
  buildExecutor(context: EvoContext) {
    return async (params: FIND_SCRIPT_FN_PARAMS): Promise<Result<AgentFunctionResult, string>> => {
      const candidates = context.scripts.searchAllScripts(
        `${params.namespace} ${params.description}`
      ).slice(0, 5);

      if (candidates.length === 0) {
        return ResultOk(NO_SCRIPTS_FOUND_ERROR(params))
      }
    
      return ResultOk(FIND_SCRIPT_SUCCESS(params, candidates));
    };
  }
}

const NO_SCRIPTS_FOUND_ERROR = (params: FIND_SCRIPT_FN_PARAMS): AgentFunctionResult => ({
  outputs: [
    {
      type: AgentOutputType.Error,
      title: FIND_SCRIPT_TITLE(params),
      content: FUNCTION_CALL_SUCCESS_CONTENT(
        FIND_SCRIPT_FN_NAME,
        params,
        `Found no results for script '${params.namespace}'. Try creating the script instead.`
      ),
    }
  ],
  messages: [
    ChatMessageBuilder.functionCall(FIND_SCRIPT_FN_NAME, params),
    ChatMessageBuilder.functionCallResult(
      FIND_SCRIPT_FN_NAME,
      `Found no results for script '${params.namespace}'. Try creating the script instead.`
    ),
  ]
});
const FIND_SCRIPT_TITLE = (params: FIND_SCRIPT_FN_PARAMS) => `Searched for '${params.namespace}' script ("${params.description}")`;
import { Result, ResultOk } from "@polywrap/result";
import { AgentFunction, AgentFunctionResult, AgentOutputType, ChatMessageBuilder } from "@evo-ninja/agent-utils";
import { AgentContext } from "../AgentContext";
import { Script } from "../Scripts";
import { FUNCTION_CALL_SUCCESS_CONTENT } from "../prompts";

const FN_NAME = "findScript";
type FuncParameters = { 
  namespace: string, 
  description: string 
};

const SUCCESS = (params: FuncParameters, candidates: Script[]): AgentFunctionResult => ({
  outputs: [
    {
      type: AgentOutputType.Success,
      title: FIND_SCRIPT_TITLE(params),
      content: FUNCTION_CALL_SUCCESS_CONTENT(
        FN_NAME,
        params,
        `Found the following results for script '${params.namespace}'` + 
        `\n--------------\n` + 
        `${candidates.map((c) => `Namespace: ${c.name}\nArguments: ${c.arguments}\nDescription: ${c.description}`).join("\n--------------\n")}\n` +
        `\n--------------\n`
      )
    }
  ],
  messages: [
    ChatMessageBuilder.functionCall(FN_NAME, params),
    ChatMessageBuilder.system(
      `Found the following results for script '${params.namespace}'\n` + 
      `${candidates.map((c) => `Namespace: ${c.name}\nArguments: ${c.arguments}\nDescription: ${c.description}`).join("\n--------------\n")}\n` +
      `\`\`\``
    ),
  ]
});
const NO_SCRIPTS_FOUND_ERROR = (params: FuncParameters): AgentFunctionResult => ({
  outputs: [
    {
      type: AgentOutputType.Error,
      title: FIND_SCRIPT_TITLE(params),
      content: FUNCTION_CALL_SUCCESS_CONTENT(
        FN_NAME,
        params,
        `Found no results for script '${params.namespace}'. Try creating the script instead.`
      ),
    }
  ],
  messages: [
    ChatMessageBuilder.functionCall(FN_NAME, params),
    ChatMessageBuilder.system(`Found no results for script '${params.namespace}'. Try creating the script instead.`),
  ]
});
const FIND_SCRIPT_TITLE = (params: FuncParameters) => `Searched for '${params.namespace}' script ("${params.description}")`;

export const findScript: AgentFunction<AgentContext> = {
  definition: {
    name: "findScript",
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
  buildExecutor(context: AgentContext) {
    return async (params: FuncParameters): Promise<Result<AgentFunctionResult, string>> => {
      const candidates = context.scripts.searchScripts(
        `${params.namespace} ${params.description}`
      ).slice(0, 5);

      if (candidates.length === 0) {
        return ResultOk(NO_SCRIPTS_FOUND_ERROR(params))
      }
    
      return ResultOk(SUCCESS(params, candidates));
    };
  }
};

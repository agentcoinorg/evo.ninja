import { Result, ResultOk } from "@polywrap/result";
import { AgentFunction, AgentFunctionResult } from "@evo-ninja/agent-utils";
import { AgentContext } from "../AgentContext";
import { Script } from "../Scripts";

const FN_NAME = "findScript";
type FuncParameters = { 
  namespace: string, 
  description: string 
};

const SUCCESS = (params: FuncParameters, candidates: Script[]): AgentFunctionResult => ({
  outputs: [
    {
      type: "success",
      title: FIND_SCRIPT_TITLE(params),
      content: FOUND_SCRIPTS_CONTENT(params, candidates, JSON.stringify(params, null, 2)),
    }
  ],
  messages: [
    {
      role: "assistant",
      content: "",
      function_call: {
        name: FN_NAME,
        arguments: JSON.stringify(params)
      },
    },
    {
      role: "system",
      content: FOUND_SCRIPTS_CONTENT(params, candidates, JSON.stringify(params, null, 2))
    },
  ]
});
const NO_SCRIPTS_FOUND_ERROR = (params: FuncParameters): AgentFunctionResult => ({
  outputs: [
    {
      type: "success",
      title: FIND_SCRIPT_TITLE(params),
      content: NO_SCRIPTS_FOUND(params, JSON.stringify(params, null, 2))
    }
  ],
  messages: [
    {
      role: "assistant",
      content: "",
      function_call: {
        name: FN_NAME,
        arguments: JSON.stringify(params)
      },
    },
    {
      role: "system",
      content: NO_SCRIPTS_FOUND(params, JSON.stringify(params, null, 2)),
    },
  ]
});
const FIND_SCRIPT_TITLE = (params: FuncParameters) => `Searched for '${params.namespace}' script ("${params.description}")`;
const FOUND_SCRIPTS_CONTENT = (
  params: FuncParameters,
  candidates: Script[],
  argsStr: string
) => `## Function Call:\n\`\`\`javascript\n${FN_NAME}(${argsStr})\n\`\`\`\n` +
  `## Result\n\`\`\`\n${
  `Found the following candidates for script: ${params.namespace}:` + 
  `\n--------------\n` + 
  `${candidates.map((c) => `Namespace: ${c.name}\nArguments: ${c.arguments}\nDescription: ${c.description}`).join("\n--------------\n")}` +
  `\n--------------\n`
  }\n\`\`\``;

const NO_SCRIPTS_FOUND = (params: FuncParameters, argsStr: string) =>
  `### Function Call:\n\`\`\`javascript\n${FN_NAME}(${argsStr})\n\`\`\`\n` +
  `## Result\n\`\`\`\n` +
  `Found no candidates for script '${params.namespace}'. Try creating the script instead.\n` +
  `\`\`\``;


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

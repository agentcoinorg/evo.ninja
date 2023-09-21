import { ResultOk } from "@polywrap/result";
import { AgentFunction, AgentFunctionResult, BasicAgentMessage } from "@evo-ninja/agent-utils";
import { AgentContext } from "../AgentContext";
import { Script } from "../Scripts";

const FN_NAME = "findScript";

const FIND_SCRIPT_TITLE = (params: FuncParameters) => `Searched for '${params.namespace}' script ("${params.description}")`;
const FOUND_SCRIPTS_CONTENT = (
  params: FuncParameters,
  candidates: Script[],
  argsStr: string
) => `# Function Call:\n\`\`\`javascript\n${FN_NAME}(${argsStr})\n\`\`\`\n` +
  `## Result\n\`\`\`\n${
  `Found the following candidates for script: ${params.namespace}:` + 
  `\n--------------\n` + 
  `${candidates.map((c) => `Namespace: ${c.name}\nArguments: ${c.arguments}\nDescription: ${c.description}`).join("\n--------------\n")}` +
  `\n--------------\n`
  }\n\`\`\``;

const NO_SCRIPTS_FOUND = (params: FuncParameters, argsStr: string) =>
  `# Function Call:\n\`\`\`javascript\n${FN_NAME}(${argsStr})\n\`\`\`\n` +
  `## Result\n\`\`\`\n` +
  `Found no candidates for script '${params.namespace}'. Try creating the script instead.\n` +
  `\`\`\``;

type FuncParameters = { 
  namespace: string, 
  description: string 
};

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
    return async (params: FuncParameters): Promise<AgentFunctionResult> => {
      const candidates = context.scripts.searchScripts(
        `${params.namespace} ${params.description}`
      ).slice(0, 5);

      const argsStr = JSON.stringify(params, null, 2);
     
      if (candidates.length === 0) {
        return ResultOk([BasicAgentMessage.error("system", FIND_SCRIPT_TITLE(params), NO_SCRIPTS_FOUND(params, argsStr))])
      }
    
      return ResultOk([
        BasicAgentMessage.ok(
          "system",
          FIND_SCRIPT_TITLE(params),
          FOUND_SCRIPTS_CONTENT(params, candidates, argsStr)
        )
      ]);
    };
  }
};

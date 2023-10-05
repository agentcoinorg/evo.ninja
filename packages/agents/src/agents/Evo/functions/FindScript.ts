<<<<<<< Updated upstream:packages/agents/src/agents/Evo/functions/findScript.ts
import { Script, AgentFunctionResult, AgentOutputType, ChatMessageBuilder, AgentFunctionDefinition } from "@evo-ninja/agent-utils";
import { FUNCTION_CALL_SUCCESS_CONTENT } from "../utils";
=======
import { Agent, AgentFunctionResult, AgentOutputType, ChatMessageBuilder, Script } from "@evo-ninja/agent-utils";
import { Result, ResultOk } from "@polywrap/result";
import { AgentFunctionBase, HandlerResult } from "../../../AgentFunctionBase";
>>>>>>> Stashed changes:packages/agents/src/agents/Evo/functions/FindScript.ts
import { EvoContext } from "../config";
import { FUNCTION_CALL_SUCCESS_CONTENT } from "../utils";
;

interface FindScriptFuncParameters { 
  namespace: string, 
  description: string, 
  arguments: string, 
  code: string 
};

<<<<<<< Updated upstream:packages/agents/src/agents/Evo/functions/findScript.ts
export const findScriptFunction: {
  definition: AgentFunctionDefinition;
  buildExecutor: (context: EvoContext) => (params: FIND_SCRIPT_FN_PARAMS) => Promise<AgentFunctionResult>;
} = {
  definition: {
    name: FIND_SCRIPT_FN_NAME,
    description: `Search for an script.`,
    parameters: {
=======
export class FindScriptFunction extends AgentFunctionBase<EvoContext, FindScriptFuncParameters> {
  get name(): string {
    return "findScript";
  }
  get description(): string {
    return `Search for an script.`;
  }
  get parameters() {
    return {
>>>>>>> Stashed changes:packages/agents/src/agents/Evo/functions/FindScript.ts
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
<<<<<<< Updated upstream:packages/agents/src/agents/Evo/functions/findScript.ts
    },
  },
  buildExecutor(context: EvoContext) {
    return async (params: FIND_SCRIPT_FN_PARAMS): Promise<AgentFunctionResult> => {
=======
    }
  }

  buildExecutor(agent: Agent<unknown>, context: EvoContext): (params: FindScriptFuncParameters) => Promise<Result<AgentFunctionResult, string>> {
    return async (params: FindScriptFuncParameters): Promise<Result<AgentFunctionResult, string>> => {
>>>>>>> Stashed changes:packages/agents/src/agents/Evo/functions/FindScript.ts
      const candidates = context.scripts.searchAllScripts(
        `${params.namespace} ${params.description}`
      ).slice(0, 5);

      if (candidates.length === 0) {
<<<<<<< Updated upstream:packages/agents/src/agents/Evo/functions/findScript.ts
        return NO_SCRIPTS_FOUND_ERROR(params)
      }
    
      return FIND_SCRIPT_SUCCESS(params, candidates);
=======
        return ResultOk(this.onNoScriptsFoundError(params))
      }
    
      return ResultOk(this.onSuccess(params, candidates));
>>>>>>> Stashed changes:packages/agents/src/agents/Evo/functions/FindScript.ts
    };
  }

  private onSuccess(params: FindScriptFuncParameters, candidates: Script[]): HandlerResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: this.findScriptTitle(params),
          content: FUNCTION_CALL_SUCCESS_CONTENT(
            this.name,
            params,
            `Found the following results for script '${params.namespace}'` + 
            `\n--------------\n` + 
            `${candidates.map((c) => `Namespace: ${c.name}\nArguments: ${c.arguments}\nDescription: ${c.description}`).join("\n--------------\n")}\n` +
            `\n--------------\n`
          )
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, params),
        ChatMessageBuilder.functionCallResult(
          this.name,
          `Found the following results for script '${params.namespace}'\n` + 
          `${candidates.map((c) => `Namespace: ${c.name}\nArguments: ${c.arguments}\nDescription: ${c.description}`).join("\n--------------\n")}\n` +
          `\`\`\``
        ),
      ]
    }
  }



  private onNoScriptsFoundError(params: FindScriptFuncParameters) {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: this.findScriptTitle(params),
          content: FUNCTION_CALL_SUCCESS_CONTENT(
            this.name,
            params,
            `Found no results for script '${params.namespace}'. Try creating the script instead.`
          ),
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, params),
        ChatMessageBuilder.functionCallResult(
          this.name,
          `Found no results for script '${params.namespace}'. Try creating the script instead.`
        ),
      ]
    }
  }

  private findScriptTitle(params: FindScriptFuncParameters) {
    return `Searched for '${params.namespace}' script ("${params.description}")`
  }
}

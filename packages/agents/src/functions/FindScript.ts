import { Agent, AgentFunctionResult, AgentOutputType, AgentVariables, ChatMessageBuilder, Script, Scripts } from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../AgentFunctionBase";
import { FUNCTION_CALL_SUCCESS_CONTENT } from "../agents/Scripter/utils";
import { AgentBaseContext } from "../AgentBase";

interface FindScriptFuncParameters { 
  namespace: string, 
  description: string, 
  arguments: string, 
  code: string 
}

export class FindScriptFunction extends AgentFunctionBase<FindScriptFuncParameters> {
  constructor(private scripts: Scripts) {
    super();
  }

  get name(): string {
    return "findScript";
  }
  get description(): string {
    return `Search for an script.`;
  }
  get parameters() {
    return {
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
    }
  }

  buildExecutor(agent: Agent<unknown>, context: AgentBaseContext): (params: FindScriptFuncParameters, rawParams: string | undefined) => Promise<AgentFunctionResult> {
    return async (params: FindScriptFuncParameters, rawParams: string | undefined): Promise<AgentFunctionResult> => {
      const candidates = this.scripts.searchAllScripts(
        `${params.namespace} ${params.description}`
      ).slice(0, 5);

      if (candidates.length === 0) {
        return this.onError(params, rawParams, context.variables)
      }
    
      return this.onSuccess(params, rawParams, candidates, context.variables);
    };
  }

  private onSuccess(params: FindScriptFuncParameters, rawParams: string | undefined, candidates: Script[], variables: AgentVariables): AgentFunctionResult {
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
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ChatMessageBuilder.functionCallResult(
          this.name,
          `Found the following results for script '${params.namespace}'\n` + 
          `${candidates.map((c) => `Namespace: ${c.name}\nArguments: ${c.arguments}\nDescription: ${c.description}`).join("\n--------------\n")}\n` +
          `\`\`\``,
          variables
        ),
      ]
    }
  }

  private onError(params: FindScriptFuncParameters, rawParams: string | undefined, variables: AgentVariables) {
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
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ChatMessageBuilder.functionCallResult(
          this.name,
          `Found no results for script '${params.namespace}'. Try creating the script instead.`,
          variables
        ),
      ]
    }
  }

  private findScriptTitle(params: FindScriptFuncParameters) {
    return `Searched for '${params.namespace}' script ("${params.description}")`
  }
}

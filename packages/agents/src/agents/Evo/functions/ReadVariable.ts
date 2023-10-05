import { Agent, AgentFunctionResult, AgentOutputType, ChatMessageBuilder } from "@evo-ninja/agent-utils";
import { Result, ResultOk } from "@polywrap/result";
import { AgentFunctionBase, HandlerResult } from "../../../AgentFunctionBase";
import { EvoContext } from "../config";
import { FUNCTION_CALL_FAILED, FUNCTION_CALL_SUCCESS_CONTENT } from "../utils";

interface ReadVarFuncParameters { 
  name: string,
  start: number,
  count: number
};

export class ReadVariableFunction<TContext extends EvoContext> extends AgentFunctionBase<TContext, ReadVarFuncParameters> {
  constructor(private maxVarLength: number = 3000) {
    super();
  }
  
  get name(): string {
    return "readVariable";
  }
  get description(): string {
    return `Writes the function.`;
  }
  get parameters(): any {
    return {
      type: "object",
      properties: {
        namespace: {
          type: "string",
          description: "The namespace of the function, e.g. fs.readFile"
        },
        description: {
          type: "string",
          description: "The detailed description of the function."
        },
        arguments: {
          type: "string",
          description: "The arguments of the function. E.g. '{ path: string, encoding: string }'"
        },
        code: {
          type: "string",
          description: "The code of the function."
        }
      },
      required: ["namespace", "description", "arguments", "code"],
      additionalProperties: false
    }
  }

  buildExecutor(agent: Agent<unknown>, context: TContext): (params: ReadVarFuncParameters) => Promise<Result<AgentFunctionResult, string>> {
    return async (params: ReadVarFuncParameters): Promise<Result<AgentFunctionResult, string>> => {
      if (!context.globals[params.name]) {
        return ResultOk(this.onVarNotFound(params));
      } 

      return ResultOk(this.onSuccess(params, context.globals[params.name]));
    };
  }

  private onSuccess(params: ReadVarFuncParameters, varValue: string): HandlerResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `Read '${params.name}' variable.`,
          content: FUNCTION_CALL_SUCCESS_CONTENT(
            this.name,
            params,
            this.readGlobalVarOutput(params.name, varValue, params.start, params.count)
          )
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, params),
        ChatMessageBuilder.functionCallResult(
          this.name,
          this.readGlobalVarMessage(params.name, varValue, params.start, params.count)
        )
      ]
    }
  }

  private onVarNotFound(params: ReadVarFuncParameters): HandlerResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `Failed to read '${params.name}' variable.`, 
          content: FUNCTION_CALL_FAILED(params, this.name, `Global variable {{${params.name}}} not found.`)
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, params),
        ChatMessageBuilder.functionCallResult(
          this.name,
          `Error: Global variable {{${params.name}}} not found.`
        )
      ]
    }
  }

  private readGlobalVarOutput(varName: string, value: string | undefined, start: number, count: number) {
    if (!value || value === "\"undefined\"") {
      return `## Variable {{${varName}}} is undefined`;
    } else if (value.length > this.maxVarLength) {
      const val = value.substring(start, start + Math.min(count, this.maxVarLength));
      return `## Read variable {{${varName}}}, but it is too large, JSON preview (start: ${start}, count: ${Math.min(count, this.maxVarLength)}):\n\`\`\`\n${val}...\n\`\`\``;
    } else {
      return `## Read variable {{${varName}}}, JSON:\n\`\`\`\n${value}\n\`\`\``;
    }
  }

  private readGlobalVarMessage(varName: string, value: string | undefined, start: number, count: number) {
    if (!value || value === "\"undefined\"") {
      return `Variable {{${varName}}} is undefined`;
    } else if (value.length > this.maxVarLength) {
      const val = value.substring(start, start + Math.min(count, this.maxVarLength));
      return `Read variable {{${varName}}}, but it is too large, JSON preview (start: ${start}, count: ${Math.min(count, this.maxVarLength)}):\n\`\`\`\n${val}...\n\`\`\``;
    } else {
      return `Read variable {{${varName}}}, JSON:\n\`\`\`\n${value}\n\`\`\``;
    }
  }
}

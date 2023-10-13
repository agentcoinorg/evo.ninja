import { Agent, AgentFunctionResult, AgentOutputType, AgentVariables, ChatMessageBuilder } from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../AgentFunctionBase";
import { FUNCTION_CALL_FAILED, FUNCTION_CALL_SUCCESS_CONTENT } from "../agents/Scripter/utils";
import { AgentBaseContext } from "../AgentBase";

interface ReadVarFuncParameters {
  name: string,
  start: number,
  count: number
}

export class ReadVariableFunction extends AgentFunctionBase<ReadVarFuncParameters> {
  constructor(private maxVarLength: number = 3000) {
    super();
  }

  get name(): string {
    return "readVariable";
  }

  get description(): string {
    return "Read a ${variable}";
  }

  get parameters(): any {
    return {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "${name} of a variable"
        },
        start: {
          type: "number",
          description: "Index to start reading at"
        },
        count: {
          type: "number",
          description: "Number of bytes to read"
        }
      },
      required: ["name", "start", "count"],
      additionalProperties: false
    }
  }

  buildExecutor(agent: Agent<unknown>, context: AgentBaseContext): (params: ReadVarFuncParameters, rawParams?: string) => Promise<AgentFunctionResult> {
    return async (params: ReadVarFuncParameters, rawParams?: string): Promise<AgentFunctionResult> => {
      const variable = context.variables.get(params.name);
      if (!variable) {
        return this.onError(params, rawParams, context.variables);
      }

      return this.onSuccess(params, rawParams, variable);
    };
  }

  private onSuccess(params: ReadVarFuncParameters, rawParams: string | undefined, varValue: string | undefined): AgentFunctionResult {
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
        ChatMessageBuilder.functionCall(this.name, rawParams),
        {
          role: "function",
          name: this.name,
          content: this.readGlobalVarMessage(params.name, varValue, params.start, params.count)
        }
      ]
    }
  }

  private onError(params: ReadVarFuncParameters, rawParams: string | undefined, variables: AgentVariables): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `Failed to read '${params.name}' variable.`, 
          content: FUNCTION_CALL_FAILED(params, this.name, `Variable \${${params.name}} not found.`)
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ...ChatMessageBuilder.functionCallResult(
          this.name,
          `Error: Variable \${${params.name}} not found.`,
          variables
        )
      ]
    }
  }

  private readGlobalVarOutput(varName: string, value: string | undefined, start: number, count: number) {
    return `## ${this.readGlobalVarMessage(varName, value, start, count)}`;
  }

  private readGlobalVarMessage(varName: string, value: string | undefined, start: number, count: number) {
    if (!value || value === "\"undefined\"") {
      return `Variable \${${varName}} is undefined`;
    }
    else {
      let warn = "";
      if (count > this.maxVarLength) {
        warn = `Warning: maximum read length is ${this.maxVarLength} bytes, result will be shortened.`;
      }
      const cnt = Math.min(count, this.maxVarLength);
      const end = Math.min(start + cnt, value.length);
      const val = value.substring(start, end);
      return `${warn}\nReading ${start}-${end} bytes of variable \${${varName}} (length ${value.length}):\n\`\`\`\n${val}...\n\`\`\``;
    } 
  }
}

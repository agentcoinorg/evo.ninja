import { Agent, AgentFunctionResult, AgentOutputType, AgentVariables, ChatMessageBuilder } from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../AgentFunctionBase";
import { FUNCTION_CALL_FAILED, FUNCTION_CALL_SUCCESS_CONTENT } from "../agents/Scripter/utils";
import { AgentBaseContext } from "../AgentBase";

interface ReadVarFuncParameters { 
  name: string,
  start: number,
  count: number
};

// TODO: need to visit this implementation
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

  buildExecutor(agent: Agent<unknown>, context: AgentBaseContext): (params: ReadVarFuncParameters) => Promise<AgentFunctionResult> {
    return async (params: ReadVarFuncParameters): Promise<AgentFunctionResult> => {
      const variable = context.variables.get(params.name);
      if (!variable) {
        return this.onError(params);
      } 

      return this.onSuccess(params, variable);
    };
  }

  private onSuccess(params: ReadVarFuncParameters, varValue: string): AgentFunctionResult {
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

  private onError(params: ReadVarFuncParameters): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `Failed to read '${params.name}' variable.`, 
          content: FUNCTION_CALL_FAILED(params, this.name, `Variable \${${params.name}} not found.`)
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, params),
        ChatMessageBuilder.functionCallResult(
          this.name,
          `Error: Variable \${${params.name}} not found.`
        )
      ]
    }
  }

  private readGlobalVarOutput(varName: string, value: string | undefined, start: number, count: number) {
    if (!value || value === "\"undefined\"") {
      return `## Variable \${${varName}} is undefined`;
    } else if (value.length > this.maxVarLength) {
      const val = value.substring(start, start + Math.min(count, this.maxVarLength));
      return `## Read variable \${${varName}}, but it is too large, JSON preview (start: ${start}, count: ${Math.min(count, this.maxVarLength)}):\n\`\`\`\n${val}...\n\`\`\``;
    } else {
      return `## Read variable \${${varName}}, JSON:\n\`\`\`\n${value}\n\`\`\``;
    }
  }

  private readGlobalVarMessage(varName: string, value: string | undefined, start: number, count: number) {
    if (!value || value === "\"undefined\"") {
      return `Variable \${${varName}} is undefined`;
    } else if (value.length > this.maxVarLength) {
      const val = value.substring(start, start + Math.min(count, this.maxVarLength));
      return `Read variable \${${varName}}, but it is too large, JSON preview (start: ${start}, count: ${Math.min(count, this.maxVarLength)}):\n\`\`\`\n${val}...\n\`\`\``;
    } else {
      return `Read variable \${${varName}}, JSON:\n\`\`\`\n${value}\n\`\`\``;
    }
  }
}

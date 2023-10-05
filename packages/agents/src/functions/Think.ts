import { Agent, AgentFunctionResult, AgentOutputType, ChatMessageBuilder } from "@evo-ninja/agent-utils";
import { Result, ResultOk } from "@polywrap/result";
import { AgentFunctionBase, HandlerResult } from "../AgentFunctionBase";

interface ThinkFuncParameters { 
  thoughts: string
};

export class ThinkFunction extends AgentFunctionBase<unknown, ThinkFuncParameters> {
  get name(): string {
    return "think";
  }
  get description(): string {
    throw new Error("Method not implemented.");
  }
  get parameters(): any {
    throw new Error("Method not implemented.");
  }

  buildExecutor(agent: Agent<unknown>, context: unknown): (params: ThinkFuncParameters) => Promise<Result<AgentFunctionResult, string>> {
    return async (params: ThinkFuncParameters): Promise<Result<AgentFunctionResult, string>> => {
      return ResultOk(this.onSuccess(params));
    };
  }

  private onSuccess(params: ThinkFuncParameters): HandlerResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `Thinking...`,
          content: 
            `## Thoughts:\n` +
            `\`\`\`\n` +
            `${params.thoughts}\n` +
            `\`\`\``
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, params),
        ChatMessageBuilder.functionCallResult(this.name, "Assistant, please respond."),
      ]
    }
  }
}
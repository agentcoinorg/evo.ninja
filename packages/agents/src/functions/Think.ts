import { AgentFunctionResult, AgentOutputType, ChatMessageBuilder } from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../AgentFunctionBase";

interface ThinkFuncParameters { 
  thoughts: string
}

export class ThinkFunction extends AgentFunctionBase<ThinkFuncParameters> {

  name: string = "think";
  description: string = "Helps me to think what I should do if I don't know how to achieve the goal";
  parameters: any = {
    type: "object",
    properties: {
      thoughts: {
        type: "string",
        description: "Your current thoughts about the topic."
      },
    },
    required: ["thoughts"],
    additionalProperties: false
  };

  buildExecutor(): (params: ThinkFuncParameters, rawParams?: string) => Promise<AgentFunctionResult> {
    return async (params: ThinkFuncParameters, rawParams?: string): Promise<AgentFunctionResult> => {
      return this.onSuccess(params, rawParams, params.thoughts);
    };
  }

  public onSuccess(params: any, rawParams: string | undefined, result: string) {
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
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ChatMessageBuilder.functionCallResult(this.name, result),
      ]
    }
  }
}
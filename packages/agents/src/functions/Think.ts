import { Agent, AgentFunctionResult, AgentOutputType, AgentVariables, ChatMessageBuilder } from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../AgentFunctionBase";
import { ScriptedAgent } from "../scriptedAgents";
import { AgentBaseContext } from "../AgentBase";

interface ThinkFuncParameters { 
  thoughts: string
}

export class ThinkFunction extends AgentFunctionBase<ThinkFuncParameters> {
  get name(): string {
    return "think";
  }

  get description(): string {
    return "Helps me to think what I should do if I don't know how to achieve the goal";
  }

  get parameters() {
    return {
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
  }

  buildExecutor(agent: Agent<unknown>, context: AgentBaseContext): (params: ThinkFuncParameters, rawParams?: string) => Promise<AgentFunctionResult> {
    return async (params: ThinkFuncParameters, rawParams?: string): Promise<AgentFunctionResult> => {
      return this.onSuccess(agent as ScriptedAgent, params, rawParams, params.thoughts, context.variables);
    };
  }

  public onSuccess(scriptedAgent: ScriptedAgent, params: any, rawParams: string | undefined, result: string, variables: AgentVariables) {
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
        ChatMessageBuilder.functionCallResult(this.name, result, variables),
      ]
    }
  }

  public onFailure(scriptedAgent: ScriptedAgent, params: any, rawParams: string | undefined, error: string, variables: AgentVariables): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `[${scriptedAgent.config.name}] Error in ${this.name}: ${error}`,
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ChatMessageBuilder.functionCallResult(this.name, error, variables)
      ]
    }
  }
}
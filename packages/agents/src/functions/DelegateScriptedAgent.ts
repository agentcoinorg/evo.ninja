import { AgentOutputType, ChatMessageBuilder, AgentOutput, Agent, AgentFunctionResult, ChatMessage } from "@evo-ninja/agent-utils"
import { AgentFunctionBase } from "../AgentFunctionBase";
import { AgentBase, AgentBaseContext } from "../AgentBase";

interface DelegateAgentParams {
  task: string;
  context?: string;
}

interface AgentRunArgs {
  goal: string
}

export class DelegateAgentFunction<
  TAgent extends AgentBase<AgentRunArgs, AgentBaseContext>
> extends AgentFunctionBase<DelegateAgentParams> {
  constructor(
    private delegatedAgent: TAgent,
  ) {
    super();
  }

  get name() {
    return this.delegateScriptedAgentFnName(this.delegatedAgent.config.name)
  }

  get description() {
    return `Delegate a task to "${this.delegatedAgent.config.name}" with expertise in "${this.delegatedAgent.config.expertise}". Provide all the required information to fully complete the task.`
  }

  get parameters() {
    return {
      type: "object",
      properties: {
        task: {
          type: "string",
          description: "The task to be delegated"
        },
        context: {
          type: "string",
          description: "Necessary information required to fully completed the task."
        }
      },
      required: ["task"],
      additionalProperties: false
    }
  }

  onSuccess(name: string, params: any, messages: string[], result: AgentOutput): AgentFunctionResult {
    return {
      outputs: [
        result
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.delegateScriptedAgentFnName(name), params),
        ...messages.map(x => ({
          role: "assistant",
          content: x,
        }) as ChatMessage),
        ChatMessageBuilder.functionCallResult(
          this.delegateScriptedAgentFnName(name),
          result.content || "Successfully accomplished the task."
        )
      ]
    }
  }

  onFailure(name: string, params: any, error: string | undefined): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `"${name}" failed to accomplish the task "${params.task}"`,
          content: `Error: ${error}`
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.delegateScriptedAgentFnName(name), params),
        ChatMessageBuilder.functionCallResult(
          this.delegateScriptedAgentFnName(name),
          `Error: ${error}`
        )
      ]
    }
  }

  buildExecutor(agent: Agent<unknown>, context: AgentBaseContext) {
    return async (params: DelegateAgentParams): Promise<AgentFunctionResult> => {
      const scriptedAgent = this.delegatedAgent;

      let iterator = scriptedAgent.run({
        goal: params.task,
      }, params.context);

      const messages = [];

      while (true) {
        const response = await iterator.next();

        if (response.done) {
          if (!response.value.ok) {
            return this.onFailure(
              this.delegatedAgent.config.name,
              params,
              response.value.error
            );
          }
        
          return this.onSuccess(
            this.delegatedAgent.config.name,
            params,
            messages,
            response.value.value
          );
        } else {
          if (response.value.type === "message" && response.value.content) {
            messages.push(response.value.content);
          }
        }

        response.value && context.logger.info(response.value.title);
      }
    }
  }

  private delegateScriptedAgentFnName(agent: string) { return `delegate${agent}` }
}
import { AgentOutputType, ChatMessageBuilder, AgentOutput, Agent, AgentFunctionResult, ChatMessage } from "@evo-ninja/agent-utils"
import { AgentFunctionBase } from "../../../AgentFunctionBase";
import { AgentBaseConfig } from "../../../AgentBase";
import { AgentBase, AgentBaseContext } from "../../../AgentBase";

interface DelegateAgentParams {
  task: string;
}

interface AgentRunArgs {
  goal: string
}

export class DelegateAgentFunction<
  TAgentContext extends AgentBaseContext,
  TAgent extends AgentBase<AgentRunArgs, TAgentContext>
> extends AgentFunctionBase<TAgentContext, DelegateAgentParams> {
  constructor(
    private config: AgentBaseConfig<AgentRunArgs, TAgentContext>,
    private factory: (context: TAgentContext) => TAgent
  ) {
    super();
  }

  get name() {
    return this.delegateScriptedAgentFnName(this.config.name)
  }

  get description() {
    return `Delegate a task to "${this.config.name}" with expertise in "${this.config.expertise}". Provide all the required information to fully complete the task.`
  }

  get parameters() {
    return {
      type: "object",
      properties: {
        task: {
          type: "string",
          description: "The task to be delegated. Provide all the required information to fully complete the task."
        }
      }
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

  buildExecutor(agent: Agent<unknown>, context: TAgentContext) {
    return async (params: DelegateAgentParams): Promise<AgentFunctionResult> => {
      const scriptedAgent = this.factory(context);

      let iterator = scriptedAgent.run({
        goal: params.task
      });

      const messages = [];

      while (true) {
        const response = await iterator.next();

        if (response.done) {
          if (!response.value.ok) {
            return this.onFailure(
              this.config.name,
              params,
              response.value.error
            );
          }
        
          return this.onSuccess(
            this.config.name,
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
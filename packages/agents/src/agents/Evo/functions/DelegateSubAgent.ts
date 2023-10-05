import { AgentOutputType, ChatMessageBuilder, AgentOutput, Agent, AgentFunctionResult, Chat } from "@evo-ninja/agent-utils"
import { SubAgent, SubAgentConfig, SubAgentContext } from "../../../subagents"
import { HandlerResult } from "../../../subagents/SubAgentFunction"
import { AgentFunctionBase } from "../../../AgentFunctionBase";
import { Result, ResultOk } from "@polywrap/result";

interface DelegateSubAgentParams {
  task: string;
}

export class DelegateSubAgentFunction<TAgentContext extends SubAgentContext> extends AgentFunctionBase<TAgentContext, DelegateSubAgentParams> {
  constructor(private subAgentConfig: SubAgentConfig) {
    super();
  }

  get name() {
    return this.delegateSubAgentFnName(this.subAgentConfig.name)
  }

  get description() {
    return `Delegate a task to "${this.subAgentConfig.name}" with expertise in "${this.subAgentConfig.expertise}"`
  }

  get parameters() {
    return {
      type: "object",
      properties: {
        task: {
          type: "string",
          description: "The task to be delegated"
        }
      }
    }
  }

  onSuccess(name: string, params: any, result: AgentOutput): HandlerResult {
    return {
      outputs: [
        result
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.delegateSubAgentFnName(name), params),
        ChatMessageBuilder.functionCallResult(
          this.delegateSubAgentFnName(name),
          `Successfully accomplished the task.`
        )
      ]
    }
  }

  onFailure(name: string, params: any, error: string | undefined): HandlerResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `"${name}" failed to accomplish the task "${params.task}"`,
          content: `Error: ${error}`
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.delegateSubAgentFnName(name), params),
        ChatMessageBuilder.functionCallResult(
          this.delegateSubAgentFnName(name),
          `Error: ${error}`
        )
      ]
    }
  }

  buildExecutor(agent: Agent<unknown>, context: TAgentContext) {
    return async (params: DelegateSubAgentParams): Promise<Result<AgentFunctionResult, string>> => {
      const subagent = new SubAgent(
        this.subAgentConfig, {
          ...context,
          chat: new Chat(context.chat.tokenizer, context.chat.contextWindow)
        }
      );

      let iterator = subagent.run({
        goal: params.task
      });

      while (true) {
        const response = await iterator.next();

        if (response.done) {
          if (!response.value.ok) {
            return ResultOk(this.onFailure(
              this.subAgentConfig.name,
              params,
              response.value.error
            ));
          }
          response.value.value
          return ResultOk(this.onSuccess(
            this.subAgentConfig.name,
            params,
            response.value.value
          ));
        }

        response.value && context.logger.info(response.value.title);
      }
    }
  }

  private delegateSubAgentFnName(agent: string) { return `delegate${agent}` }
}
import { AgentOutputType, ChatMessageBuilder, AgentOutput, Agent, AgentFunctionResult, Chat } from "@evo-ninja/agent-utils"
import { ScriptedAgent, ScriptedAgentConfig, ScriptedAgentContext } from "../../../scriptedAgents"
import { AgentFunctionBase, HandlerResult } from "../../../AgentFunctionBase";
import { Result, ResultOk } from "@polywrap/result";

interface DelegateScriptedAgentParams {
  task: string;
}

export class DelegateScriptedAgentFunction<TAgentContext extends ScriptedAgentContext> extends AgentFunctionBase<TAgentContext, DelegateScriptedAgentParams> {
  constructor(private scriptedAgentConfig: ScriptedAgentConfig) {
    super();
  }

  get name() {
    return this.delegateScriptedAgentFnName(this.scriptedAgentConfig.name)
  }

  get description() {
    return `Delegate a task to "${this.scriptedAgentConfig.name}" with expertise in "${this.scriptedAgentConfig.expertise}"`
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
        ChatMessageBuilder.functionCall(this.delegateScriptedAgentFnName(name), params),
        ChatMessageBuilder.functionCallResult(
          this.delegateScriptedAgentFnName(name),
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
        ChatMessageBuilder.functionCall(this.delegateScriptedAgentFnName(name), params),
        ChatMessageBuilder.functionCallResult(
          this.delegateScriptedAgentFnName(name),
          `Error: ${error}`
        )
      ]
    }
  }

  buildExecutor(agent: Agent<unknown>, context: TAgentContext) {
    return async (params: DelegateScriptedAgentParams): Promise<Result<AgentFunctionResult, string>> => {
      const scriptedAgent = new ScriptedAgent(
        this.scriptedAgentConfig, {
          ...context,
          chat: new Chat(context.chat.tokenizer, context.chat.contextWindow)
        }
      );

      let iterator = scriptedAgent.run({
        goal: params.task
      });

      while (true) {
        const response = await iterator.next();

        if (response.done) {
          if (!response.value.ok) {
            return ResultOk(this.onFailure(
              this.scriptedAgentConfig.name,
              params,
              response.value.error
            ));
          }
          response.value.value
          return ResultOk(this.onSuccess(
            this.scriptedAgentConfig.name,
            params,
            response.value.value
          ));
        }

        response.value && context.logger.info(response.value.title);
      }
    }
  }

  private delegateScriptedAgentFnName(agent: string) { return `delegate${agent}` }
}
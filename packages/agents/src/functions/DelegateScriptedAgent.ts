import { AgentOutputType, ChatMessageBuilder, AgentOutput, AgentFunctionResult, ChatMessage, AgentVariables, LlmApi, Tokenizer } from "@evo-ninja/agent-utils"
import { LlmAgentFunctionBase } from "../LlmAgentFunctionBase";
import { Agent } from "../Agent";

interface DelegateAgentParams {
  task: string;
  context?: string;
}

export class DelegateAgentFunction<
  TAgent extends Agent
> extends LlmAgentFunctionBase<DelegateAgentParams> {
  private _name: string;
  private _expertise: string;

  constructor(
    private delegatedAgent: TAgent | (() => TAgent),
    llm: LlmApi,
    tokenizer: Tokenizer
  ) {
    super(llm, tokenizer);

    // TODO: we need a better way of handling agent lifetimes
    //       and static values associated with them (config + factory)
    const config = typeof this.delegatedAgent === "function" ?
      this.delegatedAgent().config :
      this.delegatedAgent.config;

    this._expertise = config.prompts.expertise;
    this._name = config.prompts.name;
  }

  get name() {
    return this.delegateScriptedAgentFnName(this._name)
  }
  get description(): string {
    return `Delegate a task to "${this._name}" with expertise in "${this._expertise}". Provide all the required information to fully complete the task.`;
  }
  parameters: any = {
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
  };

  buildExecutor({ context }: Agent<unknown>) {
    return async (params: DelegateAgentParams, rawParams?: string): Promise<AgentFunctionResult> => {
      const scriptedAgent = typeof this.delegatedAgent === "function" ?
        this.delegatedAgent() :
        this.delegatedAgent;

      const result = await this.askAgent(
        scriptedAgent,
        { goal: `Task: ${params.task}${params.context ? `\nContext: ${params.context}` : ""}` },
        context
      );

      if (!result.ok) {
        return this.onFailure(
          scriptedAgent.config.prompts.name,
          params,
          rawParams,
          result.error,
          context.variables
        );
      }

      return this.onSuccess(
        scriptedAgent.config.prompts.name,
        rawParams,
        result.value.messages,
        result.value.output,
        context.variables
      );
    }
  }

  onSuccess(name: string, rawParams: string | undefined, messages: string[], result: AgentOutput, variables: AgentVariables): AgentFunctionResult {
    return {
      outputs: [
        result
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.delegateScriptedAgentFnName(name), rawParams),
        ...messages.map(x => ({
          role: "assistant",
          content: x,
        }) as ChatMessage),
        ...ChatMessageBuilder.functionCallResultWithVariables(
          this.delegateScriptedAgentFnName(name),
          result.content || "Successfully accomplished the task.",
          variables
        )
      ]
    }
  }

  onFailure(name: string, params: any, rawParams: string | undefined, error: string | undefined, variables: AgentVariables): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `"${name}" failed to accomplish the task "${params.task}"`,
          content: `Error: ${error}`
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.delegateScriptedAgentFnName(name), rawParams),
        ...ChatMessageBuilder.functionCallResultWithVariables(
          this.delegateScriptedAgentFnName(name),
          `Error: ${error}`,
          variables
        )
      ]
    }
  }

  private delegateScriptedAgentFnName(agent: string) {
    return `delegate${agent}`;
  }
}

import { AgentOutputType, ChatMessageBuilder, AgentOutput, AgentFunctionResult, ChatMessage, AgentVariables, LlmApi, Tokenizer } from "@/agent-core"
import { LlmAgentFunctionBase } from "./utils";
import { Agent } from "../agents/utils";

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
    return this.delegateAgentFnName(this._name)
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
      const delegatedAgentInst = typeof this.delegatedAgent === "function" ?
        this.delegatedAgent() :
        this.delegatedAgent;

      const result = await this.askAgent(
        delegatedAgentInst,
        { goal: `Task: ${params.task}${params.context ? `\nContext: ${params.context}` : ""}` },
        context
      );

      if (!result.ok) {
        return this.onFailure(
          delegatedAgentInst.config.prompts.name,
          params,
          rawParams,
          result.error
        );
      }

      return this.onSuccess(
        delegatedAgentInst.config.prompts.name,
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
        ChatMessageBuilder.functionCall(this.delegateAgentFnName(name), rawParams),
        ...messages.map(x => ({
          role: "assistant",
          content: x,
        }) as ChatMessage),
        ChatMessageBuilder.functionCallResult(
          this.delegateAgentFnName(name),
          result.content || "Successfully accomplished the task."
        )
      ]
    }
  }

  onFailure(name: string, params: any, rawParams: string | undefined, error: string | undefined): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `"${name}" failed to accomplish the task "${params.task}"`,
          content: `Error: ${error}`
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.delegateAgentFnName(name), rawParams),
        ChatMessageBuilder.functionCallResult(
          this.delegateAgentFnName(name),
          `Error: ${error}`
        )
      ]
    }
  }

  private delegateAgentFnName(agent: string) {
    return `delegate${agent}`;
  }
}

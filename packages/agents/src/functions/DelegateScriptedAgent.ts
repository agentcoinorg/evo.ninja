import { AgentOutputType, ChatMessageBuilder, AgentOutput, Agent, AgentFunctionResult, ChatMessage, AgentVariables } from "@evo-ninja/agent-utils"
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
  private _name: string;
  private _expertise: string;

  constructor(
    private delegatedAgent: TAgent | (() => TAgent),
  ) {
    super();

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

  buildExecutor(agent: Agent<unknown>, context: AgentBaseContext) {
    return async (params: DelegateAgentParams, rawParams?: string): Promise<AgentFunctionResult> => {
      const scriptedAgent = typeof this.delegatedAgent === "function" ?
        this.delegatedAgent() :
        this.delegatedAgent;

      let iterator = scriptedAgent.run({
        goal: params.task,
      }, params.context);

      const messages = [];

      while (true) {
        const response = await iterator.next();

        if (response.done) {
          if (!response.value.ok) {
            return this.onFailure(
              scriptedAgent.config.prompts.name,
              params,
              rawParams,
              response.value.error,
              context.variables
            );
          }
        
          return this.onSuccess(
            scriptedAgent.config.prompts.name,
            rawParams,
            messages,
            response.value.value,
            context.variables
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

  private delegateScriptedAgentFnName(agent: string) {
    return `delegate${agent}`;
  }
}

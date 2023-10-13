import { AgentOutputType, Scripts, ChatMessageBuilder, AgentOutput, Agent, AgentFunctionResult, ChatMessage, Chat, WrapClient, AgentVariables } from "@evo-ninja/agent-utils"
import { AgentFunctionBase } from "../AgentFunctionBase";
import { GoalVerifierAgent } from "../scriptedAgents";
import { AgentBaseContext } from "../AgentBase";

interface FunctionParams {
  task: string;
  context?: string;
}

export class VerifyGoalAchievedFunction extends AgentFunctionBase<FunctionParams> {
  constructor(private client: WrapClient, private scripts: Scripts) {
    super();
  }

  get name() {
    return "verifyGoalAchieved";
  }

  get description() {
    return `Verifies that the goal has been achieved.`
  }

  get parameters() {
    return {
      type: "object",
      properties: {
      },
      required: [],
      additionalProperties: false
    }
  }

  onSuccess(name: string, rawParams: string | undefined, messages: string[], result: AgentOutput, variables: AgentVariables): AgentFunctionResult {
    return {
      outputs: [
        result
      ],
      messages: [
        ChatMessageBuilder.functionCall(name, rawParams),
        ...messages.map(x => ({
          role: "assistant",
          content: x,
        }) as ChatMessage),
        ...ChatMessageBuilder.functionCallResult(
          name,
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
        ChatMessageBuilder.functionCall(name, rawParams),
        ...ChatMessageBuilder.functionCallResult(
          name,
          `Error: ${error}`,
          variables
        )
      ]
    }
  }

  buildExecutor(agent: Agent<unknown>, context: AgentBaseContext) {
    return async (params: FunctionParams, rawParams?: string): Promise<AgentFunctionResult> => {
      const scriptedAgent = new GoalVerifierAgent(
        {
          chat: new Chat(context.chat.tokenizer),
          env: context.env,
          llm: context.llm,
          logger: context.logger,
          workspace: context.workspace,
          scripts: this.scripts,
          client: this.client,
          variables: context.variables
        }
      );

      let iterator = scriptedAgent.run({
        goal: "",
        initialMessages: context.chat.messages
      }, params.context);

      const messages = [];

      while (true) {
        const response = await iterator.next();

        if (response.done) {
          if (!response.value.ok) {
            return this.onFailure(
              this.name,
              params,
              rawParams,
              response.value.error,
              context.variables
            );
          }
        
          return this.onSuccess(
            this.name,
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
}
import {
    Agent,
    AgentFunctionResult,
    LlmApi,
    ChatLogs,
    Tokenizer,
    ChatMessageBuilder,
  } from "@evo-ninja/agent-utils";
  import { AgentFunctionBase } from "../AgentFunctionBase";
  import { AgentBaseContext } from "../AgentBase";
  
  interface FunctionParams {
    goal: string;
    context: string;
  }
  
  export class DevelopmentPlanner extends AgentFunctionBase<FunctionParams> {
    constructor(
      private _llm: LlmApi,
      private _tokenizer: Tokenizer
    ) {
      super();
    }
  
    get name() {
      return "planDevelopmentTasks";
    }
  
    get description() {
      return `Create execution steps to tackle any software development task`;
    }
  
    get parameters() {
      return {
        type: "object",
        properties: {
          goal: {
            type: "string",
          },
          context: {
            type: "string",
            description:
              "Necessary information required to fully complete the task.",
          },
        },
        required: ["goal", "context"],
        additionalProperties: false,
      };
    }
  
    buildExecutor(_: Agent<unknown>, context: AgentBaseContext) {
      return async (
        params: FunctionParams,
        rawParams?: string
      ): Promise<AgentFunctionResult> => {
        const message = params.goal;
        const chatLogs = new ChatLogs({
          persistent: {
            tokens: this._tokenizer.encode(message).length,
            msgs: [
              {
                role: "user",
                content: `
You are a senior software architect agent which specializes architecting and planning complex software programs development.
Given a task, your job is to implement a step-by-step plan to code the implementation of the asked goal.

You must be very aware of the goal from the user, as it could bring information about how the testing should be done, if this is the case please
develop the entire plan around the tests, or examples.`,
              },
              {
                role: "user",
                content: message,
              },
              {
                role: "user",
                content: params.context
              }
            ],
          },
          temporary: {
            tokens: 0,
            msgs: [],
          },
        });
        const response = await this._llm.getResponse(chatLogs, undefined);
  
        if (!response?.content) {
          return {
            outputs: [],
            messages: [
              ChatMessageBuilder.functionCall(this.name, params),
              ChatMessageBuilder.functionCallResult(
                this.name,
                "Error creating a plan. Can you please provide more details"
              ),
            ],
          };
        }
        return {
          outputs: [],
          messages: [
            ChatMessageBuilder.functionCall(this.name, params),
            ChatMessageBuilder.functionCallResult(
              this.name,
              response.content,
            ),
          ],
        };
      };
    }
  }
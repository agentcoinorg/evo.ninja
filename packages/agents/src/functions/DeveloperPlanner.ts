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

export class DeveloperPlanner extends AgentFunctionBase<FunctionParams> {
  constructor(
    private _llm: LlmApi,
    private _tokenizer: Tokenizer
  ) {
    super();
  }

  get name() {
    return "developerPlanner";
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
You specialize in thinking the entire process of software developement.
Your paramount responsibility is to devise a step-by-step plan to execute a given task,
ensuring tests are conceived prior to actual implementation.

It's of utmost importance that you meticulously analyze the given goal and information available.
Often, it contains explicit details or hints about the testing requirements, which are helpful when it comes to creating the plan
`,
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
              "Error creating a plan. Can you please provide more details",
              context.variables
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
            context.variables
          ),
        ],
      };
    };
  }
}

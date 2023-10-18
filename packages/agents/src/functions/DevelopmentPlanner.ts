import {
  Agent,
  AgentFunctionResult,
  LlmApi,
  ChatLogs,
  Tokenizer,
  ChatMessageBuilder,
  ChatMessage,
} from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../AgentFunctionBase";
import { AgentBaseContext } from "../AgentBase";

interface FunctionParams {
  goal: string;
  context?: string;
  summarizedInfo?: string;
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
          description: "The goal that the user wants to achieve"
        },
        context: {
          type: "string",
          description: "Necessary information required sucessfully create the goal."
        },
        summarizedInfo: {
          type: "string",
          description: "Information about summarized files available in workspace"
        }
      },
      required: ["goal"],
      additionalProperties: false,
    };
  }

  buildExecutor(_: Agent<unknown>, context: AgentBaseContext) {
    return async (
      params: FunctionParams,
      rawParams?: string
    ): Promise<AgentFunctionResult> => {
      const message = params.goal;

      const content = `Given the goal: ${params.goal}. Please create a step-by-step plan to succesfully build what is asked.

Your plan MUST consist in coding and testing iterations. Do not add anything into the plan that the user hasn't asked for.

### IMPORTANT
Before starting to write any plan, make sure that you understand what is given in the goal; as they may provide insights into the testing strategy. 
If this is the case, your plan should be centered around these tests or user-provided examples.`;
      const msgs: ChatMessage[] = [
        {
          role: "user",
          content,
        },
      ];
      if (params.context) {
        msgs.push({
          role: "user",
          content: params.context,
        });
      }
      if (params.summarizedInfo) {
        msgs.push({
          role: "user",
          content: params.summarizedInfo,
        });
      }
      const chatLogs = new ChatLogs({
        persistent: {
          tokens: this._tokenizer.encode(message).length,
          msgs,
        },
        temporary: {
          tokens: 0,
          msgs: [],
        },
      });
      const response = await this._llm.getResponse(chatLogs, undefined);

      if (!response || !response.content) {
        throw new Error("Failed to plan development: No response from LLM");
      }

      return {
        outputs: [],
        messages: [
          ChatMessageBuilder.functionCall(this.name, rawParams),
          ...ChatMessageBuilder.functionCallResultWithVariables(
            this.name,
            response.content,
            context.variables
          ),
        ],
      };
    };
  }
}

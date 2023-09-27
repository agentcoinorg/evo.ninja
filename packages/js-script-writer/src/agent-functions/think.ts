import { Result, ResultOk } from "@polywrap/result";
import { AgentFunction, AgentFunctionResult, AgentOutputType, ChatMessageBuilder } from "@evo-ninja/agent-utils";
import { AgentContext } from "../AgentContext";

const FN_NAME = "think";
type FuncParameters = { 
  thoughts: string
};

const SUCCESS = (params: FuncParameters): AgentFunctionResult => ({
  outputs: [
    {
      type: AgentOutputType.SUCCESS,
      title: `Thinking...`,
      content: 
        `## Thoughts:\n` +
        `\`\`\`\n` +
        `${params.thoughts}\n` +
        `\`\`\``
    }
  ],
  messages: [
    ChatMessageBuilder.functionCall(FN_NAME, params),
    ChatMessageBuilder.system(
      `Thoughts:\n` + 
      `\`\`\`\n` + 
      `${params.thoughts}\n` + 
      `\`\`\``
    ),
  ]
});

export const think: AgentFunction<AgentContext> = {
  definition: {
    name: FN_NAME,
    description: `Think.`,
    parameters: {
      type: "object",
      properties: {
        thoughts: {
          type: "string",
          description: "Your current thoughts about the topic."
        },
      },
      required: ["thoughts"],
      additionalProperties: false
    },
  },
  buildExecutor(context: AgentContext) {
    return async (params: FuncParameters): Promise<Result<AgentFunctionResult, string>> => {
      return ResultOk(SUCCESS(params));
    };
  }
};

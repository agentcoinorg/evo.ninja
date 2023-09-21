import { Result, ResultOk } from "@polywrap/result";
import { AgentFunction, AgentFunctionResult } from "@evo-ninja/agent-utils";
import { AgentContext } from "../AgentContext";
import { OTHER_EXECUTE_FUNCTION_OUTPUT } from "../prompts";

const FN_NAME = "think";
type FuncParameters = { 
  thoughts: string
};

const SUCCESS = (params: FuncParameters): AgentFunctionResult => ({
  outputs: [
    {
      type: "success",
      title: `Thinking...`,
      content: 
        `## Function Call:\n\`\`\`javascript\n${FN_NAME}\n\`\`\`\n` +
        OTHER_EXECUTE_FUNCTION_OUTPUT(`I think: ${params.thoughts}.`)
    }
  ],
  messages: [
    {
      role: "assistant",
      content: "",
      function_call: {
        name: FN_NAME,
        arguments: JSON.stringify(params)
      },
    },
    {
      role: "system",
      content: `## Function Call:\n\`\`\`javascript\n${FN_NAME}\n\`\`\`\n` +
        OTHER_EXECUTE_FUNCTION_OUTPUT(`I think: ${params.thoughts}.`)
    },
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

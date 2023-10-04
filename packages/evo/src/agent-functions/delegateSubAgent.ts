import { AgentContext } from "../AgentContext";

import {
  AgentFunction,
  AgentFunctionResult,
  AgentOutput,
  AgentOutputType,
  ChatMessageBuilder
} from "@evo-ninja/agent-utils";
import { SubAgent } from "@evo-ninja/subagents";
import { Result, ResultOk } from "@polywrap/result";

type FuncParameters = {
  task: string;
}

const TASK_SUCCESS = (
  name: string,
  params: FuncParameters,
  result: AgentOutput
): AgentFunctionResult => ({
  outputs: [
    result
  ],
  messages: [
    ChatMessageBuilder.functionCall(`delegate${name}`, params),
    ChatMessageBuilder.system(
      `"${name}" successfully accomplished the task.`
    )
  ]
});

const TASK_FAIL = (
  name: string,
  params: FuncParameters,
  error: string | undefined
): AgentFunctionResult => ({
  outputs: [
    {
      type: AgentOutputType.Error,
      title: `"${name}" failed to accomplish the task "${params.task}"`,
      content: `Error: ${error}`
    }
  ],
  messages: [
    ChatMessageBuilder.functionCall(`delegate${name}`, params),
    ChatMessageBuilder.system(`Error: ${error}`)
  ]
});

export function delegateSubAgent(
  name: string,
  expertise: string,
  createSubAgent: (context: AgentContext) => SubAgent<any>
): AgentFunction<AgentContext> {
  return {
    definition: {
      name: `delegate${name}`,
      description: `Delegate a task to "${name}" with expertise in "${expertise}"`,
      parameters: {
        type: "object",
        properties: {
          task: {
            type: "string",
            description: "The task to be delegated"
          }
        }
      }
    },
    buildExecutor(context: AgentContext) {
      return async (params: FuncParameters): Promise<Result<AgentFunctionResult, string>> => {
        const subagent = createSubAgent(context);

        let iterator = subagent.run({
          goal: params.task
        });

        while (true) {
          const response = await iterator.next();

          if (response.done) {
            if (!response.value.ok) {
              return ResultOk(TASK_FAIL(
                name,
                params,
                response.value.error
              ));
            }
            response.value.value
            return ResultOk(TASK_SUCCESS(
              name,
              params,
              response.value.value
            ));
          }

          response.value && context.logger.info(response.value.title);
        }
      }
    }
  }
}

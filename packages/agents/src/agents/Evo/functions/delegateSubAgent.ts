import { EvoContext } from "../config";
import { SubAgent, SubAgentConfig } from "../../..";

import {
  AgentFunction,
  AgentFunctionResult,
  AgentOutput,
  AgentOutputType,
  ChatMessageBuilder
} from "@evo-ninja/agent-utils";
import { Result, ResultOk } from "@polywrap/result";

export const DELEGATE_SUBAGENT_FN_NAME = (agent: string) => `delegate${agent}`;

type DELEGATE_SUBAGENT_FN_PARAMS = {
  task: string;
}

const DELEGATE_SUBAGENT_SUCCESS = (
  name: string,
  params: DELEGATE_SUBAGENT_FN_PARAMS,
  result: AgentOutput
): AgentFunctionResult => ({
  outputs: [
    result
  ],
  messages: [
    ChatMessageBuilder.functionCall(DELEGATE_SUBAGENT_FN_NAME(name), params),
    ChatMessageBuilder.functionCallResult(
      DELEGATE_SUBAGENT_FN_NAME(name),
      `Successfully accomplished the task.`
    )
  ]
});

const DELEGATE_SUBAGENT_FAIL = (
  name: string,
  params: DELEGATE_SUBAGENT_FN_PARAMS,
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
    ChatMessageBuilder.functionCall(DELEGATE_SUBAGENT_FN_NAME(name), params),
    ChatMessageBuilder.functionCallResult(
      DELEGATE_SUBAGENT_FN_NAME(name),
      `Error: ${error}`
    )
  ]
});

export function delegateSubAgent(
  config: SubAgentConfig
): AgentFunction<EvoContext> {
  return {
    definition: {
      name: DELEGATE_SUBAGENT_FN_NAME(config.name),
      description: `Delegate a task to "${config.name}" with expertise in "${config.expertise}"`,
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
    buildExecutor(context: EvoContext) {
      return async (params: DELEGATE_SUBAGENT_FN_PARAMS): Promise<Result<AgentFunctionResult, string>> => {
        const subagent = new SubAgent(
          config,
          context
        );

        let iterator = subagent.run({
          goal: params.task
        });

        while (true) {
          const response = await iterator.next();

          if (response.done) {
            if (!response.value.ok) {
              return ResultOk(DELEGATE_SUBAGENT_FAIL(
                config.name,
                params,
                response.value.error
              ));
            }
            response.value.value
            return ResultOk(DELEGATE_SUBAGENT_SUCCESS(
              config.name,
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
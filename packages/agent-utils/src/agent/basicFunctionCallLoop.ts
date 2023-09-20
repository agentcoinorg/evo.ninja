import { Chat, LlmApi, LlmResponse } from "../llm";
import { StepOutput, RunResult } from "./agent";
import {
  ExecuteAgentFunction,
  ExecuteAgentFunctionResult,
  ExecuteAgentFunctionCalled,
  AgentFunction
} from "./agent-function";

import { ResultErr, ResultOk } from "@polywrap/result";

export async function* basicFunctionCallLoop<TContext extends { llm: LlmApi, chat: Chat }>(
  context: TContext,
  executeAgentFunction: ExecuteAgentFunction,
  agentFunctions: AgentFunction<TContext>[],
  shouldTerminate: (
    functionCalled: ExecuteAgentFunctionCalled,
    result: ExecuteAgentFunctionResult["result"]
  ) => boolean,
  loopPreventionPrompt: string,
): AsyncGenerator<StepOutput, RunResult, string | undefined>
{
  const { llm, chat } = context;

  while (true) {
    await chat.fitToContextWindow();

    const response = await llm.getResponse(chat, agentFunctions.map(f => f.definition));

    if (!response) {
      return ResultErr("No response from LLM.");
    }

    if (response.function_call) {
      const { name, arguments: args } = response.function_call;
      const { result, functionCalled } = await executeAgentFunction(name, args, context, agentFunctions);

      if (!result.ok) {
        chat.temporary("system", result.error);
        yield StepOutput.message({ type: "error", title: `Failed to execute ${name}!`, content: result.error });
        continue;
      }

      for (let i = 0; i < result.value.length; i++) {
        const msg = result.value[i];
        chat.temporary(msg.chatMessage);

        if (i === result.value.length - 1 &&
          functionCalled && shouldTerminate(functionCalled, result)
        ) {
          return ResultOk(StepOutput.message(msg.outputMessage));
        }

        yield StepOutput.message(msg.outputMessage);
      }
    } else {
      yield* _preventLoopAndSaveMsg(chat, response, loopPreventionPrompt);
    }
  }
}

async function* _preventLoopAndSaveMsg(chat: Chat, response: LlmResponse, loopPreventionPrompt: string): AsyncGenerator<StepOutput, void, string | undefined> {
  if (chat.messages[chat.messages.length - 1].content === response.content &&
    chat.messages[chat.messages.length - 2].content === response.content) {
      chat.temporary("system", loopPreventionPrompt);
      yield StepOutput.message({
        type: "warning",
        title: "Loop prevention",
        content: loopPreventionPrompt
      });
  } else {
    chat.temporary(response);
    yield StepOutput.message({
      type: "success",
      title: "Agent response",
      content: response.content ?? ""
    });
  }
}

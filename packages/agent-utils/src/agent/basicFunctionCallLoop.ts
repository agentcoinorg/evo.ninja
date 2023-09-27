import { Chat, ChatMessage, LlmApi } from "../llm";
import { AgentOutput } from "./AgentOutput";
import { RunResult } from "./agent";
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
): AsyncGenerator<AgentOutput, RunResult, string | undefined>
{
  const { llm, chat } = context;

  while (true) {
    await chat.fitToContextWindow();
    await chat.condenseFindScriptMessages();

    const functionDefinitions = agentFunctions.map(f => f.definition);
    const response = await llm.getResponse(chat, functionDefinitions);

    if (!response) {
      return ResultErr("No response from LLM.");
    }

    if (response.function_call) {
      const { name, arguments: args } = response.function_call;
      const { result, functionCalled } = await executeAgentFunction(name, args, context, agentFunctions);

      if (!result.ok) {
        chat.temporary("system", result.error);
        yield { type: "error", title: `Failed to execute ${name}!`, content: result.error } as AgentOutput;
        continue;
      }

      result.value.messages.forEach(x => chat.temporary(x));

      for (let i = 0; i < result.value.outputs.length; i++) {
        const output = result.value.outputs[i];

        if (i === result.value.outputs.length - 1 &&
          functionCalled && shouldTerminate(functionCalled, result)
        ) {
          return ResultOk(output);
        }

        yield output;
      }
    } else {
      yield* _preventLoopAndSaveMsg(chat, response, loopPreventionPrompt);
    }
  }
}

async function* _preventLoopAndSaveMsg(chat: Chat, response: ChatMessage, loopPreventionPrompt: string): AsyncGenerator<AgentOutput, void, string | undefined> {
  if (chat.messages[chat.messages.length - 1].content === response.content &&
    chat.messages[chat.messages.length - 2].content === response.content) {
      chat.temporary("system", loopPreventionPrompt);
      yield {
        type: "warning",
        title: "Loop prevention",
        content: loopPreventionPrompt
      } as AgentOutput;
  } else {
    chat.temporary(response);
    yield {
      type: "success",
      title: "Agent response",
      content: response.content ?? ""
    } as AgentOutput;
  }
}

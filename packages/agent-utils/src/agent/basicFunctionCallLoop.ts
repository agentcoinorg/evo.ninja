import { RunResult } from "./Agent";
import { AgentOutput, AgentOutputType } from "./AgentOutput";
import { AgentFunction } from "./AgentFunction";
import {
  ExecuteAgentFunctionCalled,
  ExecuteAgentFunctionResult,
  executeAgentFunction,
  processFunctionAndArgs
} from "./processFunctionArgs";
import { Chat, ChatMessage, LlmApi } from "../llm";

import { ResultErr, ResultOk } from "@polywrap/result";
import { AGENT_SPEAK_RESPONSE } from "./prompts";
import {AgentVariables} from "./AgentVariables";

export async function* basicFunctionCallLoop<TContext extends { llm: LlmApi, chat: Chat, variables: AgentVariables }>(
  context: TContext,
  agentFunctions: AgentFunction<TContext>[],
  shouldTerminate: (
    functionCalled: ExecuteAgentFunctionCalled,
    result: ExecuteAgentFunctionResult["result"]
  ) => boolean,
  loopPreventionPrompt: string,
  agentSpeakPrompt: string = AGENT_SPEAK_RESPONSE
): AsyncGenerator<AgentOutput, RunResult, string | undefined>
{
  const { llm, chat } = context;

  while (true) {
    await chat.fitToContextWindow();

    const functionDefinitions = agentFunctions.map(f => f.definition);
    const response = await llm.getResponse(chat.chatLogs, functionDefinitions);

    if (!response) {
      return ResultErr("No response from LLM.");
    }

    if (response.function_call) {
      const { name, arguments: args } = response.function_call;

      if (args) {
        let i = 0;
        while ((i = args.indexOf(AgentVariables.Prefix)) !== -1) {
          const endIdx = args.indexOf(AgentVariables.Suffix, i);
          const varWithSyntax = args.substring(i, endIdx + 1);
          const varContents = context.variables.get(varWithSyntax);
          if (varContents) {
            args.replace(varWithSyntax, varContents);
          }
        }
      }

      const sanitizedFunctionAndArgs = processFunctionAndArgs(name, args, agentFunctions)
      if (!sanitizedFunctionAndArgs.ok) {
        chat.temporary(response);
        chat.temporary("system", sanitizedFunctionAndArgs.error);
        yield { type: AgentOutputType.Error, title: `Failed to sanitize function ${name}!`, content: sanitizedFunctionAndArgs.error } as AgentOutput;
        continue;
      }

      // TODO: pass down un-processed args + use then for all `ChatMessageBuilder.functionCall()` usages
      const { result, functionCalled } = await executeAgentFunction(sanitizedFunctionAndArgs.value, context)

      result.messages.forEach(x => chat.temporary(x));
      const terminate = functionCalled && shouldTerminate(functionCalled, result);

      for (let i = 0; i < result.outputs.length; i++) {
        const output = result.outputs[i];

        if (i === result.outputs.length - 1 && terminate) {
          return ResultOk(output);
        }

        yield output;
      }
    } else {
      yield* _preventLoopAndSaveMsg(chat, response, loopPreventionPrompt, agentSpeakPrompt);
    }
  }
}

async function* _preventLoopAndSaveMsg(chat: Chat, response: ChatMessage, loopPreventionPrompt: string, agentSpeakPrompt: string): AsyncGenerator<AgentOutput, void, string | undefined> {
  if (chat.messages[chat.messages.length - 1].content === response.content &&
    chat.messages[chat.messages.length - 2].content === response.content) {
      chat.temporary("system", loopPreventionPrompt);
      yield {
        type: AgentOutputType.Warning,
        title: "Loop prevention",
        content: loopPreventionPrompt
      } as AgentOutput;
  } else {
    chat.temporary(response);
    chat.temporary("system", agentSpeakPrompt);
    yield {
      type: AgentOutputType.Message,
      title: "Agent message",
      content: response.content ?? ""
    } as AgentOutput;
  }
}

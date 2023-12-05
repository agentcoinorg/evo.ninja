import { ResultErr, ResultOk } from "@polywrap/result";
import { ChatLogs, FunctionDefinition, Chat, ChatMessage } from "../llm";
import { AgentFunction } from "./AgentFunction";
import { AgentOutput, AgentOutputType } from "./AgentOutput";
import { RunResult } from "./RunnableAgent";
import { ExecuteAgentFunctionCalled, ExecuteAgentFunctionResult, processFunctionAndArgs, executeAgentFunction } from "./processFunctionArgs";
import { AGENT_SPEAK_RESPONSE } from "./prompts";
import { AgentContext } from "./AgentContext";

export async function* basicFunctionCallLoop(
  context: AgentContext,
  shouldTerminate: (
    functionCalled: ExecuteAgentFunctionCalled,
    result: ExecuteAgentFunctionResult["result"]
  ) => boolean,
  loopPreventionPrompt: string,
  agentSpeakPrompt: string = AGENT_SPEAK_RESPONSE,
  beforeLlmResponse: () => Promise<{ logs: ChatLogs, agentFunctions: FunctionDefinition[], allFunctions: AgentFunction<AgentContext>[], finalOutput?: AgentOutput }>,
): AsyncGenerator<AgentOutput, RunResult, string | undefined>
{
  const { llm, chat } = context;

  while (true) {
    const { logs, agentFunctions, allFunctions, finalOutput } = await beforeLlmResponse();

    if (finalOutput) {
      return ResultOk(finalOutput);
    }

    const response = await llm.getResponse(logs, agentFunctions);

    if (!response) {
      return ResultErr("No response from LLM.");
    }

    if (response.function_call) {
      const { name, arguments: fnArgs } = response.function_call
      const sanitizedFunctionAndArgs = processFunctionAndArgs(name, fnArgs, allFunctions, context.variables)
      if (!sanitizedFunctionAndArgs.ok) {
        await chat.temporary([
          response,
          { role: "system", content: sanitizedFunctionAndArgs.error ?? null }
        ])
        yield { type: AgentOutputType.Error, title: `Failed to sanitize function ${name} with args ${fnArgs}. Error: ${sanitizedFunctionAndArgs.error}`, content: sanitizedFunctionAndArgs.error } as AgentOutput;
        continue;
      }

      const { result, functionCalled } = await executeAgentFunction(sanitizedFunctionAndArgs.value, fnArgs, context)

      // Save large results as variables
      for (const message of result.messages) {
        if (message.role !== "function") {
          continue;
        }
        const functionResult = message.content || "";
        if (result.storeInVariable || context.variables.shouldSave(functionResult)) {
          const varName = await context.variables.save(name || "", functionResult);
          message.content = `\${${varName}}`;
        }
      }

      await chat.temporary(result.messages);

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
      await chat.temporary("system", loopPreventionPrompt);
      yield {
        type: AgentOutputType.Warning,
        title: "Loop prevention",
        content: loopPreventionPrompt
      } as AgentOutput;
  } else {
    await chat.temporary([
      response,
      { role: "system", content: agentSpeakPrompt }
    ])
    yield {
      type: AgentOutputType.Message,
      title: "Agent message",
      content: response.content ?? ""
    } as AgentOutput;
  }
}

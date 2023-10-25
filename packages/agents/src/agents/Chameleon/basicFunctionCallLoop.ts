import { Chat, AgentFunction, ExecuteAgentFunctionCalled, ExecuteAgentFunctionResult, AGENT_SPEAK_RESPONSE, AgentOutput, RunResult, processFunctionAndArgs, AgentOutputType, executeAgentFunction, ChatMessage, ChatLogs, FunctionDefinition } from "@evo-ninja/agent-utils";
import { ResultErr, ResultOk } from "@polywrap/result";
import { AgentContext } from "../../AgentContext";

export async function* basicFunctionCallLoop(
  context: AgentContext,
  funcs: AgentFunction<AgentContext>[],
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
      const { name, arguments: args } = response.function_call;

      const sanitizedFunctionAndArgs = processFunctionAndArgs(name, args, allFunctions, context.variables)
      if (!sanitizedFunctionAndArgs.ok) {
        chat.temporary(response);
        chat.temporary("system", sanitizedFunctionAndArgs.error);
        yield { type: AgentOutputType.Error, title: `Failed to sanitize function ${name} with args ${args}. Error: ${sanitizedFunctionAndArgs.error}`, content: sanitizedFunctionAndArgs.error } as AgentOutput;
        continue;
      }

      const { result, functionCalled } = await executeAgentFunction(sanitizedFunctionAndArgs.value, args, context)

      // Save large results as variables
      for (const message of result.messages) {
        if (message.role !== "function") {
          continue;
        }
        const functionResult = message.content || "";
        if (result.storeInVariable || context.variables.shouldSave(functionResult)) {
          const varName = context.variables.save(name || "", functionResult);
          message.content = `\${${varName}}`;
        }
      }

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

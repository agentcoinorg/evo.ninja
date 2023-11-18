import { ResultErr, ResultOk } from "@polywrap/result";
import { ChatLogs, FunctionDefinition, Chat, ChatMessage } from "../llm";
import { AgentFunction } from "./AgentFunction";
import { AgentOutput, AgentOutputType } from "./AgentOutput";
import { RunResult } from "./RunnableAgent";
import { ExecuteAgentFunctionCalled, ExecuteAgentFunctionResult, processFunctionAndArgs, executeAgentFunction } from "./processFunctionArgs";
import { AGENT_SPEAK_RESPONSE } from "./prompts";
import { AgentContext } from "./AgentContext";

export async function* assistantsFunctionCallLoop(
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
    let run = await this.runThread(options.threadId, this._id);

    while (run.status !== "completed") {
      if (["cancelled", "failed", "expired"].includes(run.status)) {
        throw new Error("Run couldn't be completed because of status: " + run.status);
      }

      if (run.status === "requires_action") {
        await this.handleRequiredAction(run);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      run = await this.runThread(options.threadId, this._id);
    }

    return await this.waitForAssistantMessage(run.thread_id);
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

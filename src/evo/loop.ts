import { Chat } from "../chat";
import { RunResult, StepOutput, GOAL_PROMPT, INITIAL_PROMP, LOOP_PREVENTION_PROMPT } from ".";
import { LlmApi, LlmResponse } from "../llm";
import { AgentFunction, ExecuteAgentFunction } from "../agent-function";
import { Workspace } from "../workspaces";
import { WrapClient } from "../wrap";

export async function* loop(
  goal: string, 
  llm: LlmApi, 
  chat: Chat, 
  client: WrapClient, 
  globals: Record<string, any>,
  workspace: Workspace,
  executeAgentFunction: ExecuteAgentFunction,
  agentFunctions: AgentFunction[],
): AsyncGenerator<StepOutput, RunResult, string | undefined> {
  chat.persistent("system", INITIAL_PROMP);
  chat.persistent("system", GOAL_PROMPT(goal));

  while (true) {
    await chat.fitToContextWindow();

    const response = await llm.getResponse(chat, agentFunctions.map(f => f.definition));

    if (!response) {
      return RunResult.error("No response from LLM.");
    }

    if (response.function_call) {
      const { name, arguments: args } = response.function_call;
      const result = await executeAgentFunction(name, args, client, globals, workspace, functions);

      if (result.ok) {
        yield StepOutput.message(chat.temporary({ role: "system", name, content: result.value}));
      }
      else {
        yield StepOutput.message(chat.temporary("system", result.error as string));
      } 
    } else {
      yield* _preventLoopAndSaveMsg(chat, response);
    }
  }
}

async function* _preventLoopAndSaveMsg(chat: Chat, response: LlmResponse): AsyncGenerator<StepOutput, void, string | undefined> {
  if (chat.messages[chat.messages.length - 1].content === response.content &&
    chat.messages[chat.messages.length - 2].content === response.content) {
      chat.temporary("system", LOOP_PREVENTION_PROMPT);
      yield StepOutput.message(LOOP_PREVENTION_PROMPT);
  } else {
    yield StepOutput.message(chat.temporary(response));
  }
}

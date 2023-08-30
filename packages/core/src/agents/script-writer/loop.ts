import { GOAL_PROMPT, INITIAL_PROMP, LOOP_PREVENTION_PROMPT } from "./prompts";
import { RunResult, StepOutput } from "../agent";
import { AgentFunction, ExecuteAgentFunction } from "../agent-function";
import { LlmApi, LlmResponse, Chat } from "../../llm";
import { WrapClient } from "../../wrap";
import { Scripts } from "../../Scripts";
import { Workspace, Logger } from "../../sys";

export async function* loop(
  namespace: string, 
  description: string,
  args: string, 
  llm: LlmApi, 
  chat: Chat, 
  client: WrapClient, 
  globals: Record<string, any>,
  workspace: Workspace,
  scripts: Scripts,
  logger: Logger,
  executeAgentFunction: ExecuteAgentFunction,
  agentFunctions: AgentFunction[],
): AsyncGenerator<StepOutput, RunResult, string | undefined> {
  chat.persistent("system", INITIAL_PROMP);
  chat.persistent("system", GOAL_PROMPT(namespace, description, args));

  while (true) {
    await chat.fitToContextWindow();

    const response = await llm.getResponse(chat, agentFunctions.map(f => f.definition));

    if (!response) {
      return RunResult.error("No response from LLM.");
    }

    if (response.function_call) {
      const { name, arguments: args } = response.function_call;
      const result = await executeAgentFunction(
        name,
        args, {
          globals,
          client,
          workspace,
          scripts,
          llm,
          chat,
          logger
        },
        agentFunctions
      );

      if (result.ok) {
        yield StepOutput.message(chat.temporary({ role: "system", name, content: result.value.content}));
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

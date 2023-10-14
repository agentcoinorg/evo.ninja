import { Chat, ContextWindow, Env, InMemoryWorkspace, LlmApi, Logger } from "@evo-ninja/agent-utils";
import { ScriptWriter } from "./ScriptWriter";

export const createScriptWriter = (args: {
  llm: LlmApi,
  chat: Chat,
  logger: Logger,
  env: Env
}): ScriptWriter => {
  const workspace = new InMemoryWorkspace();
  const contextWindow = new ContextWindow(args.llm);
  const chat = new Chat(args.chat.tokenizer, contextWindow, args.logger);
  return new ScriptWriter(args.llm, chat, workspace, args.logger, args.env);
};

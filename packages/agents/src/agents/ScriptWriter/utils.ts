import { Chat, ContextWindow, InMemoryWorkspace } from "@evo-ninja/agent-utils";
import { ScriptWriter } from "./ScriptWriter";
import { AgentBaseContext } from "../../AgentBase";

export const createScriptWriter = (context: AgentBaseContext): ScriptWriter => {
  const workspace = new InMemoryWorkspace();
  const contextWindow = new ContextWindow(context.llm);
  const chat = new Chat(context.chat.tokenizer, contextWindow, context.logger);
  return new ScriptWriter(new AgentBaseContext(context.llm, chat, context.logger, workspace, context.env, context.scripts));
};

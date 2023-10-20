import { Chat, ContextWindow, InMemoryWorkspace } from "@evo-ninja/agent-utils";
import { ScriptWriter } from "./ScriptWriter";
import { AgentContext } from "../../AgentContext";

export const createScriptWriter = (context: AgentContext): ScriptWriter => {
  const workspace = new InMemoryWorkspace();
  const contextWindow = new ContextWindow(context.llm);
  const chat = new Chat(context.chat.tokenizer, contextWindow, context.logger);
  return new ScriptWriter(new AgentContext(context.llm, chat, context.logger, workspace, context.env, context.scripts));
};

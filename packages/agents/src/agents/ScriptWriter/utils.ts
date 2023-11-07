import { Chat } from "@/agent-core";
import { ScriptWriter } from "./ScriptWriter";
import { AgentContext } from "@/agent-core";
import { InMemoryWorkspace } from "@evo-ninja/agent-utils";

export const createScriptWriter = (context: AgentContext): ScriptWriter => {
  const workspace = new InMemoryWorkspace();
  const chat = new Chat(context.chat.tokenizer);
  return new ScriptWriter(new AgentContext(
    context.llm,
    chat,
    context.logger,
    workspace,
    context.internals,
    context.env,
    context.scripts
  ));
};

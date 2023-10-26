import { Chat, InMemoryWorkspace } from "@evo-ninja/agent-utils";
import { ScriptWriter } from "./ScriptWriter";
import { AgentContext } from "@evo-ninja/agent-utils";

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

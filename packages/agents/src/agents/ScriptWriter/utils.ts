import { Chat, OpenAIEmbeddingAPI } from "@/agent-core";
import { ScriptWriter } from "./ScriptWriter";
import { AgentContext } from "@/agent-core";
import { InMemoryWorkspace } from "@evo-ninja/agent-utils";

export const createScriptWriter = (context: AgentContext): ScriptWriter => {
  const workspace = new InMemoryWorkspace();
  const chat = new Chat(context.chat.tokenizer);
  const embedding = new OpenAIEmbeddingAPI(
    context.env.OPENAI_API_KEY,
    context.logger,
    context.chat.tokenizer,
    context.env.OPENAI_API_BASE_URL
  );

  return new ScriptWriter(new AgentContext(
    context.llm,
    embedding,
    chat,
    context.logger,
    workspace,
    context.internals,
    context.env,
    context.scripts
  ));
};

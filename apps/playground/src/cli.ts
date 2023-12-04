import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";
import dotenv from "dotenv";
import path from "path";
import { ConsoleLogger, Logger, Env, InMemoryWorkspace, Scripts, WrapClient } from "@evo-ninja/agent-utils";
import {
  LlmModel,
  Chat,
  AgentContext,
  OpenAILlmApi,
  OpenAIEmbeddingAPI
} from "@evo-ninja/agents";
import { run } from "./demos/basic";
import { LlmAdapter } from "./utils";

dotenv.config({
  path: path.join(__dirname, "../../../.env"),
});

export async function cli(): Promise<void> {
  const consoleLogger = new ConsoleLogger();
  const logger = new Logger([consoleLogger], {
    promptUser: async () => "",
  });
  const env = new Env(process.env as Record<string, string>);

  const llm = new OpenAILlmApi(
    env.OPENAI_API_KEY,
    env.GPT_MODEL as LlmModel,
    env.CONTEXT_WINDOW_TOKENS,
    env.MAX_RESPONSE_TOKENS,
    logger,
    env.OPENAI_API_BASE_URL
  );
  const chat = new Chat(cl100k_base);
  const embedding = new OpenAIEmbeddingAPI(
    env.OPENAI_API_KEY,
    logger,
    cl100k_base,
    env.OPENAI_API_BASE_URL
  );
  const context = new AgentContext(
    llm,
    embedding,
    chat,
    logger,
    new InMemoryWorkspace(),
    new InMemoryWorkspace(),
    env,
    undefined as unknown as Scripts,
    undefined as unknown as WrapClient,
    undefined
  );

  await run(new LlmAdapter(context));

  return Promise.resolve();
}

cli()
  .then(() => {
    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.abort();
  });

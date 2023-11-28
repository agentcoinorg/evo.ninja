import {
  AgentContext,
  Chat,
  ConsoleLogger,
  Env,
  Evo,
  InMemoryWorkspace,
  LlmModel,
  Logger,
  OpenAIChatCompletion,
  OpenAIEmbeddingAPI,
  Scripts,
  SubWorkspace,
} from "@evo-ninja/agents";
import cl100k_base from "gpt-tokenizer/esm/encoding/cl100k_base";
import { createInBrowserScripts } from "../../../src/scripts";

export function buildEvo() {
  const logger = new Logger([new ConsoleLogger()], {
    promptUser: () => Promise.resolve("N/A"),
  });

  const scriptsWorkspace = createInBrowserScripts();
  const scripts = new Scripts(scriptsWorkspace);

  let model = "gpt-4-0613";

  const env = new Env({
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    SERP_API_KEY: process.env.SERP_API_KEY,
    GPT_MODEL: model,
    CONTEXT_WINDOW_TOKENS: "8000",
    MAX_RESPONSE_TOKENS: "2000",
  });

  const llm = new OpenAIChatCompletion(
    env.OPENAI_API_KEY,
    env.GPT_MODEL as LlmModel,
    env.CONTEXT_WINDOW_TOKENS,
    env.MAX_RESPONSE_TOKENS,
    logger
  );

  const embedding = new OpenAIEmbeddingAPI(
    env.OPENAI_API_KEY,
    logger,
    cl100k_base
  );

  const userWorkspace = new InMemoryWorkspace();

  const internals = new SubWorkspace(".evo", userWorkspace);

  const chat = new Chat(cl100k_base);

  return new Evo(
    new AgentContext(
      llm,
      embedding,
      chat,
      logger,
      userWorkspace,
      internals,
      env,
      scripts
    )
  );
}

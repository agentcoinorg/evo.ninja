import { Chat, ConsoleLogger, Env, LlmModel, Logger, OpenAI, Timeout } from "@evo-ninja/agent-utils";
import { run } from "./playground";
import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(__dirname, "../../../.env"),
});

export async function cli(): Promise<void> {
  const consoleLogger = new ConsoleLogger();
  const logger = new Logger([
    consoleLogger,
    consoleLogger
  ], {
    promptUser: async () => "",
    logUserPrompt: (response: string) => {
      consoleLogger.info(`#User:\n${response}`);
    }
  })
  const env = new Env(
    process.env as Record<string, string>
  );

  const llm = new OpenAI(
    env.OPENAI_API_KEY,
    env.GPT_MODEL as LlmModel,
    env.CONTEXT_WINDOW_TOKENS,
    env.MAX_RESPONSE_TOKENS,
    logger
  );
  const chat = new Chat(cl100k_base);

  await run(llm, env, logger, chat);

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

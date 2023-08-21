import { FileSystemWorkspace, FileLogger } from "./sys";

import { Evo, Scripts, Env, OpenAI, Chat, Logger, ConsoleLogger } from "@evo-ninja/core";
import dotenv from "dotenv";
import readline from "readline";
import path from "path";
import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";

dotenv.config({
  path: path.join(__dirname, "../../../.env")
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const prompt = (query: string) => new Promise<string>(
  (resolve) => rl.question(query, resolve)
);

export async function cli(): Promise<void> {

  const rootDir = path.join(__dirname, "../../../");

  const scriptsWorkspace = new FileSystemWorkspace(
    path.join(rootDir, "scripts")
  );
  const scripts = new Scripts(
    scriptsWorkspace,
    "./"
  );
  const env = new Env(
    process.env as Record<string, string>
  );
  const llm = new OpenAI(
    env.OPENAI_API_KEY,
    env.GPT_MODEL,
    env.CONTEXT_WINDOW_TOKENS,
    env.MAX_RESPONSE_TOKENS
  );
  const userWorkspace = new FileSystemWorkspace(
    path.join(rootDir, "workspace")
  );
  const chat = new Chat(
    userWorkspace,
    llm,
    cl100k_base
  );
  // Generate a unique log file name
  const date = new Date();
  const logFile = `chat_${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}.md`;
  const logWorkspace = new FileSystemWorkspace(
    path.join(rootDir, "chats")
  );
  // Create a console & file logger
  const logger = new Logger([
    new ConsoleLogger(),
    new FileLogger(logWorkspace.toWorkspacePath(logFile))
  ])

  // Create Evo
  const evo = new Evo(
    userWorkspace,
    scripts,
    llm,
    chat,
    logger
  );

  await logger.logHeader();

  let goal: string | undefined = process.argv[2];

  if (!goal) {
    goal = await prompt("Enter your goal: ");
  }

  let iterator = evo.run(goal);

  while(true) {
    const response = await iterator.next();

    response.value.message && console.log(response.value.message);
  }
}

cli()
  .then(() => {
    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.abort();
  });

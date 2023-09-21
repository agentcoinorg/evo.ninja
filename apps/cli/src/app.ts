import { FileSystemWorkspace, FileLogger } from "./sys";

import {
  Evo,
  Scripts,
} from "@evo-ninja/evo-agent";
import {
  Env,
  OpenAI,
  Chat,
  ConsoleLogger,
  Logger,
  Timeout,
  Workspace
} from "@evo-ninja/agent-utils";
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

export interface App {
  evo: Evo;
  logger: Logger;
  fileLogger: FileLogger;
  consoleLogger: ConsoleLogger;
}

interface AppConfig {
  timeout?: Timeout,
  userWorkspace: Workspace
}

export function createApp({ timeout, userWorkspace }: AppConfig): App {
  const rootDir = path.join(__dirname, "../../../");

  const env = new Env(
    process.env as Record<string, string>
  );

  // Generate a unique log file
  const date = new Date();
  const logFile = `chat_${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}.md`;
  const logWorkspace = new FileSystemWorkspace(
    path.join(rootDir, "chats")
  );
  const fileLogger = new FileLogger(logWorkspace.toWorkspacePath(logFile));

  // Create logger
  const consoleLogger = new ConsoleLogger();
  const logger = new Logger([
    fileLogger,
    consoleLogger
  ], {
    promptUser: prompt,
    logUserPrompt: (response: string) => {
      fileLogger.info(`#User:\n${response}`);
    }
  })

  const scriptsWorkspace = new FileSystemWorkspace(
    path.join(rootDir, "scripts")
  );
  const scripts = new Scripts(scriptsWorkspace, "./");
  const llm = new OpenAI(
    env.OPENAI_API_KEY,
    env.GPT_MODEL,
    env.CONTEXT_WINDOW_TOKENS,
    env.MAX_RESPONSE_TOKENS,
    logger
  );

  const chat = new Chat(
    userWorkspace,
    llm,
    cl100k_base,
    logger
  );

  // Create Evo
  const evo = new Evo(
    llm,
    chat,
    logger,
    userWorkspace,
    scripts,
    timeout
  );

  return {
    evo,
    logger,
    fileLogger,
    consoleLogger
  };
}

import { FileSystemWorkspace, FileLogger } from "./sys";
import { DebugLog, DebugLlmApi } from "./diagnostic";

import { Evo, Scripts } from "@evo-ninja/evo-agent";
import {
  Env,
  OpenAI,
  Chat,
  ConsoleLogger,
  Logger,
  Timeout,
  Workspace,
  LlmApi,
} from "@evo-ninja/agent-utils";
import dotenv from "dotenv";
import readline from "readline";
import path from "path";
import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";

dotenv.config({
  path: path.join(__dirname, "../../../.env"),
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = (query: string) =>
  new Promise<string>((resolve) => rl.question(query, resolve));

export interface App {
  evo: Evo;
  logger: Logger;
  fileLogger: FileLogger;
  consoleLogger: ConsoleLogger;
  debugLog?: DebugLog;
}

export interface AppConfig {
  rootDir?: string;
  timeout?: Timeout;
  userWorkspace?: Workspace;
  debug?: boolean;
}

export function createApp(config?: AppConfig): App {
  console.log("HERERER", process.cwd())
  const rootDir = config?.rootDir
    ? (path.isAbsolute(config?.rootDir) ?
        config?.rootDir :
        path.join(process.cwd(), config?.rootDir)
    ) : path.join(__dirname, "../../../");

  const env = new Env(process.env as Record<string, string>);

  // Chat Log File
  const date = new Date();
  const logFile = `chat_${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}.md`;
  const logWorkspace = new FileSystemWorkspace(path.join(rootDir, "chats"));
  const fileLogger = new FileLogger(logWorkspace.toWorkspacePath(logFile));

  // Logger
  const consoleLogger = new ConsoleLogger();
  const logger = new Logger([fileLogger, consoleLogger], {
    promptUser: prompt,
    logUserPrompt: (response: string) => {
      fileLogger.info(`#User:\n${response}`);
    },
  });

  // Scripts
  const scriptsWorkspace = new FileSystemWorkspace(
    path.join(rootDir, "scripts")
  );
  const scripts = new Scripts(scriptsWorkspace, "./");

  // LLM
  let llm: LlmApi = new OpenAI(
    env.OPENAI_API_KEY,
    env.GPT_MODEL,
    env.CONTEXT_WINDOW_TOKENS,
    env.MAX_RESPONSE_TOKENS,
    logger
  );

  // User Workspace
  const userWorkspace =
    config?.userWorkspace ??
    new FileSystemWorkspace(path.join(rootDir, "workspace"));

  // Chat
  const chat = new Chat(userWorkspace, llm, cl100k_base, logger);

  // Debug Logging
  let debugLog: DebugLog | undefined;

  if (config?.debug) {
    debugLog = new DebugLog(
      new FileSystemWorkspace(path.join(rootDir, "debug"))
    );

    // Wrap the LLM API
    llm = new DebugLlmApi(debugLog, llm);
  }

  // Evo
  const evo = new Evo(
    llm,
    chat,
    logger,
    userWorkspace,
    scripts,
    config?.timeout
  );

  return {
    evo,
    logger,
    fileLogger,
    consoleLogger,
    debugLog,
  };
}

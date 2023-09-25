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
  taskId?: string;
}

export function createApp(config?: AppConfig): App {
  const rootDir = config?.rootDir
    ? path.resolve(config?.rootDir)
    : path.join(__dirname, "../../../");

  const date = new Date();
  const defaultId = `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
  const taskId = config?.taskId ?? defaultId;
  const env = new Env(process.env as Record<string, string>);
  const workspacePath = path.join(rootDir, "workspace", taskId);
  // Chat Log File
  const logWorkspace = new FileSystemWorkspace(workspacePath);
  const fileLogger = new FileLogger(logWorkspace.toWorkspacePath("chat.md"));

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
    config?.userWorkspace ?? new FileSystemWorkspace(workspacePath);

  // Chat
  const chat = new Chat(llm, cl100k_base, logger);

  // Debug Logging
  let debugLog: DebugLog | undefined;

  if (config?.debug) {
    debugLog = new DebugLog(
      new FileSystemWorkspace(workspacePath)
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

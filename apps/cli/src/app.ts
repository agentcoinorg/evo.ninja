import {
  AgentContext,
  Evo,
  Chat,
  DebugLlmApi,
  DebugLog,
  LlmApi,
  LlmModel,
  OpenAILlmApi,
  OpenAIEmbeddingAPI
} from "@evo-ninja/agents";
import {
  Env,
  Scripts,
  ConsoleLogger,
  Logger,
  Timeout,
  Workspace,
  SubWorkspace,
  FileLogger,
} from "@evo-ninja/agent-utils";
import { FileSystemWorkspace } from "@evo-ninja/agent-utils-fs";
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

const prompt = (fileLogger: FileLogger) => (query: string) =>
  new Promise<string>((resolve) => {
    const callback = (answer: string) => {
      fileLogger.info(`# User\n**${query}:** ${answer}`);
      resolve(answer);
    }
    rl.question(`${query}: `, callback)
  });

export interface App {
  evo: Evo;
  logger: Logger;
  fileLogger: FileLogger;
  consoleLogger: ConsoleLogger;
  debugLog?: DebugLog;
  chat: Chat
}

export interface AppConfig {
  sessionName?: string;
  timeout?: Timeout;
  rootDir?: string;
  debug?: boolean;
  customWorkspace?: Workspace;
}

export function createApp(config?: AppConfig): App {
  const rootDir = config?.rootDir
    ? path.resolve(config?.rootDir)
    : path.join(__dirname, "../../../");

  const date = new Date();
  const defaultSessionName = `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
  const sessionName = config?.sessionName ?? defaultSessionName;
  const env = new Env(process.env as Record<string, string>);
  const sessionPath = path.join(rootDir, "sessions", sessionName);

  // User Workspace
  const userWorkspace = config?.customWorkspace ?? new FileSystemWorkspace(sessionPath);

  // Internals Workspace (.evo directory)
  const internals = new SubWorkspace(".evo", userWorkspace);

  // Chat Log File
  const fileLogger = new FileLogger("chat.md", internals);

  // Logger
  const consoleLogger = new ConsoleLogger();
  const logger = new Logger([fileLogger, consoleLogger], {
    promptUser: prompt(fileLogger),
  });

  // Scripts
  const scriptsWorkspace = new FileSystemWorkspace(
    path.join(rootDir, "scripts")
  );
  const scripts = new Scripts(scriptsWorkspace, "./");

  // LLM
  let llm: LlmApi = new OpenAILlmApi(
    env.OPENAI_API_KEY,
    env.GPT_MODEL as LlmModel,
    env.CONTEXT_WINDOW_TOKENS,
    env.MAX_RESPONSE_TOKENS,
    logger,
    env.OPENAI_API_BASE_URL
  );

  // Chat
  const chat = new Chat(cl100k_base);

  // Debug Logging
  let debugLog: DebugLog | undefined;

  if (config?.debug) {
    debugLog = new DebugLog(internals);

    // Wrap the LLM API
    llm = new DebugLlmApi(debugLog, llm);
  }

  const embedding = new OpenAIEmbeddingAPI(
    env.OPENAI_API_KEY,
    logger,
    cl100k_base,
    env.OPENAI_API_BASE_URL
  );

  // Evo
  const evo = new Evo(
    new AgentContext(
      llm,
      embedding,
      chat,
      logger,
      userWorkspace,
      internals,
      env,
      scripts,
    ),
    config?.timeout
  );

  return {
    evo,
    logger,
    fileLogger,
    consoleLogger,
    debugLog,
    chat
  };
}

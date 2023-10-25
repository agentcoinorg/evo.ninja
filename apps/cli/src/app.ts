import { ChameleonAgent, GoalRunArgs } from "@evo-ninja/agents";
import {
  Env,
  OpenAI,
  Chat,
  Scripts,
  ConsoleLogger,
  Logger,
  Timeout,
  Workspace,
  LlmApi,
  ChatLogType,
  ChatMessage,
  ChatLog,
  RunnableAgent,
  LlmModel,
  AgentContext,
} from "@evo-ninja/agent-utils";
import { DebugLog, DebugLlmApi } from "@evo-ninja/agent-debug";
import { FileSystemWorkspace, FileLogger } from "@evo-ninja/agent-utils-fs";
import dotenv from "dotenv";
import readline from "readline";
import path from "path";
import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";
import { readFileSync } from "fs-extra";

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
  evo: RunnableAgent<GoalRunArgs>;
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
  messagesPath?: string;
  customWorkspace?: {
    path: string;
    workspace: Workspace;
  }
}

const getMessagesFromPath = (path: string): { type: ChatLogType, msgs: ChatMessage[]}[] => {
  const messagesString = readFileSync(path, "utf-8")
  const messages: Record<ChatLogType, ChatLog> = JSON.parse(messagesString)
  return Object.entries(messages).map(([type, { msgs }]) => ({
    type: type as ChatLogType,
    msgs
  }))
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
  const workspacePath = path.join(rootDir, "sessions", sessionName);

  // User Workspace
  const userWorkspace =
    config?.customWorkspace ?
    config.customWorkspace.workspace :
    new FileSystemWorkspace(workspacePath);

  // Internals Workspace (.evo directory)
  const internals = new FileSystemWorkspace(
    config?.customWorkspace ?
      path.join(config.customWorkspace.path, ".evo") :
      path.join(workspacePath, ".evo")
  );

  // Chat Log File
  // TODO: simply pass the workspace to the file logger
  const fileLogger = new FileLogger(path.join(workspacePath, ".evo", "chat.md"));

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
    env.GPT_MODEL as LlmModel,
    env.CONTEXT_WINDOW_TOKENS,
    env.MAX_RESPONSE_TOKENS,
    logger
  );

  // Chat
  const chat = new Chat(cl100k_base);

  if (config?.messagesPath) {
    const msgPath = path.join(rootDir, config.messagesPath)
    const messages = getMessagesFromPath(msgPath)
    for (let { type, msgs } of messages) {
      chat.add(type, msgs)
    }
  }

  // Debug Logging
  let debugLog: DebugLog | undefined;

  if (config?.debug) {
    debugLog = new DebugLog(internals);

    // Wrap the LLM API
    llm = new DebugLlmApi(debugLog, llm);
  }

  // Evo
  const evo = new ChameleonAgent(
    new AgentContext(
      llm,
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

import { FileSystemWorkspace, FileLogger } from "./sys";
import {
  Evo,
  Scripts,
  Env,
  OpenAI,
  Chat,
  ConsoleLogger,
  Logger
} from "@evo-ninja/core";
import dotenv from "dotenv";
import readline from "readline";
import path from "path";
import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";
import { PluginPackage } from "@polywrap/plugin-js";

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
      fileLogger.info(`**User**: ${response}`);
    }
  });

  const scriptsWorkspace = new FileSystemWorkspace(
    path.join(rootDir, "scripts")
  );
  const scripts = new Scripts(
    scriptsWorkspace,
    "./"
  );
  const llm = new OpenAI(
    env.OPENAI_API_KEY,
    env.GPT_MODEL,
    env.CONTEXT_WINDOW_TOKENS,
    env.MAX_RESPONSE_TOKENS,
    logger
  );
  const userWorkspace = new FileSystemWorkspace(
    path.join(rootDir, "workspace")
  );
  const chat = new Chat(
    userWorkspace,
    llm,
    cl100k_base,
    logger
  );


  const agentPackage = PluginPackage.from(module => ({
    "onGoalAchieved": async (args: any) => {
      logger.success("Goal has been achieved!");
      // process.exit(0);
      const response = await prompt("New Goal: ");
      return "User: " + response;
    },
    "onGoalFailed": async (args: any) => {
      logger.error("Goal could not be achieved!");
      // process.exit(0);
    },
    "speak": async (args: any) => {
      logger.success("Agent: " + args.message);
      return "User has been informed! If you think you've achieved the goal, execute onGoalAchieved.\nIf you think you've failed, execute onGoalFailed.";
    },
    "ask": async (args: any) => {
      logger.error("Agent: " + args.message);
      const response = await prompt("");
      return "User: " + response;
    },
  }));


  // Create Evo instance
  const evo = new Evo(
    userWorkspace,
    scripts,
    llm,
    chat,
    logger,
    agentPackage
  );

  await logger.logHeader();

  // Outer loop to keep the session alive
  while (true) {
    let goal: string | undefined = await logger.prompt("Enter your goal: ");
    let iterator = evo.run(goal);

    let goalCompleted = false;  // Flag to check if the goal is completed

    // Inner loop for each goal
    while (!goalCompleted) {  // Inner loop for each goal
      const response = await iterator.next();
    
      if (response.done) {
        if (!response.value.ok) {
          logger.error(response.value.error ?? "Unknown error");
        } else {
          logger.success("Goal has been achieved!");
        }
        break;  // Explicitly breaking out of the inner loop
      }
    
      if (response.value && 'message' in response.value) { // Type guard
        response.value.message && logger.info(response.value.message.title);
      }
    }    
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
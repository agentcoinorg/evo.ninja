import Agent, {
    StepHandler,
    StepInput,
    StepResult,
    TaskInput,
  } from 'agent-protocol';
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
  
  async function taskHandler(taskInput: TaskInput | null): Promise<StepHandler> {
    const rootDir = path.join(__dirname, "../../../");
    const env = new Env(process.env as Record<string, string>);
    const date = new Date();
    const logFile = `chat_${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}.md`;
    const logWorkspace = new FileSystemWorkspace(path.join(rootDir, "chats"));
    const fileLogger = new FileLogger(logWorkspace.toWorkspacePath(logFile));
  
    const loggerCallbacks = {
      promptUser: prompt,
      logUserPrompt: (response: string) => {
        fileLogger.info(`**User**: ${response}`);
      }
    };
  
    const consoleLogger = new ConsoleLogger();
    const logger = new Logger([fileLogger, consoleLogger], loggerCallbacks);
    
  
    const scriptsWorkspace = new FileSystemWorkspace(path.join(rootDir, "scripts"));
    const scripts = new Scripts(scriptsWorkspace, "./");
    const llm = new OpenAI(env.OPENAI_API_KEY, env.GPT_MODEL, env.CONTEXT_WINDOW_TOKENS, env.MAX_RESPONSE_TOKENS, logger);
    const userWorkspace = new FileSystemWorkspace(path.join(rootDir, "workspace"));
    const chat = new Chat(userWorkspace, llm, cl100k_base, logger);
    const agentPackage = PluginPackage.from(module => ({
      "onGoalAchieved": async () => {
        logger.success("Goal has been achieved!");
        process.exit(0);
      },
      "onGoalFailed": async () => {
        logger.error("Goal could not be achieved!");
        process.exit(0);
      }
    }));
    const evo = new Evo(userWorkspace, scripts, llm, chat, logger, agentPackage);
    let iterator = evo.run(taskInput);
  
    async function stepHandler(stepInput: StepInput | null): Promise<StepResult> {
      const response = await iterator.next(stepInput);
      const outputMessage = response.value && 'message' in response.value ? response.value.message : 'No message';
      if (response.done) {
        return {
          is_last: true,
          output: outputMessage
        };
      } else {
        return {
          is_last: false,
          output: outputMessage
        };
      }
    }
  
    return stepHandler;
  }
  
  Agent.handleTask(taskHandler).start();
  
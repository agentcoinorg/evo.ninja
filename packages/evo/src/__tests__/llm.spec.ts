import {
  OpenAI,
  Chat,
  ConsoleLogger,
  Logger,
  Env,
  ChatRole,
  ChatMessage,
  ContextWindow
} from "@evo-ninja/agent-utils";
import dotenv from "dotenv";
import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";
import path from "path";
import { agentFunctions } from "../agent-functions";

dotenv.config({
  path: path.join(__dirname, "../../../../.env")
});

describe('LLM Test Suite', () => {
  const ONE_MINUTE_TIMEOUT = 300 * 1000;

  test(`Execute`, async() => {
    const msgs = {
      "persistent": {
        "msgs": [
          {
            "role": "system",
            "content": "You are an agent that executes functions to accomplish the user's goal.\nYou can search for new function using the findFunction function.\nIf you can not find a function that matches your needs you can create one with the createFunction function.\nYou can use the agent_speak function to inform the user of anything noteworthy.\nOnce you have achieved the goal, call the agent_onGoalAchieved function.\nIf you can not achieve the goal, call the agent_onGoalFailed function.\n"
          },
          {
            "role": "system",
            "content": "The user has the following goal: write hey to a file."
          }
        ]
      },
      "temporary": {
        "msgs": [
          {
            "role": "system",
            "content": "# Function Call:\n```javascript\nfindFunction({\n  \"namespace\": \"fs_writeFile\",\n  \"description\": \"Write data to a file\"\n})\n```\n## Result\n```\nFound the following candidates for function: fs_writeFile:\n--------------\nNamespace: fs_writeFile\nArguments: { path: { type: 'string' }, data: { type: 'string' } }\nDescription: This function writes data to a file. If the file does not exist, it is created. If it does exist, it is replaced.\n--------------\n\n```"
          },
        ]
      }
    };

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
      env.GPT_MODEL,
      env.CONTEXT_WINDOW_TOKENS,
      env.MAX_RESPONSE_TOKENS,
      logger
    );
    const contextWindow = new ContextWindow(llm);
    const chat = new Chat(cl100k_base, contextWindow, logger);

    for (const msg of msgs.persistent.msgs) {
      chat.persistent(msg.role as ChatRole, msg.content);
    }

    for (const msg of msgs.temporary.msgs) {
      chat.temporary(msg.role as ChatRole, msg.content ?? "");
    }

    const currentFunctions = agentFunctions(() => ({}) as any);

    for (let i = 0; i < 20; i++) {
      const response = await llm.getResponse(chat.chatLogs, currentFunctions.map(f => f.definition), { temperature: 0.1 });
      console.log(response);
    }
  }, ONE_MINUTE_TIMEOUT);
});
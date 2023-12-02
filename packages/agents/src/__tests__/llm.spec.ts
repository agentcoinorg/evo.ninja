import {
  Chat,
  ChatRole,
  ChatLogType,
  ChatLog,
  FunctionDefinition,
  LlmModel,
  OpenAILlmApi
} from "@/agent-core";
import { ConsoleLogger, Logger, Env } from "@evo-ninja/agent-utils";
import dotenv from "dotenv";
import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";
import path from "path";

dotenv.config({
  path: path.join(__dirname, "../../../../.env")
});

describe('LLM Test Suite', () => {
  const ONE_MINUTE_TIMEOUT = 300 * 1000;

  test(`Execute`, async() => {
    const msgs: Record<ChatLogType, ChatLog> = {
      persistent: {
        tokens: 0,
        msgs: [
          {
            role: "system",
            content: "You are an agent that executes functions to accomplish the user's goal.\nYou can search for new function using the findFunction function.\nIf you can not find a function that matches your needs you can create one with the createFunction function.\nYou can use the agent_speak function to inform the user of anything noteworthy.\nOnce you have achieved the goal, call the agent_onGoalAchieved function.\nIf you can not achieve the goal, call the agent_onGoalFailed function.\n"
          },
          {
            role: "system",
            content: "The user has the following goal: write hey to a file."
          }
        ]
      },
      temporary: {
        tokens: 0,
        msgs: [
          {
            role: "system",
            content: "# Function Call:\n```javascript\nfindFunction({\n  \"namespace\": \"fs_writeFile\",\n  \"description\": \"Write data to a file\"\n})\n```\n## Result\n```\nFound the following candidates for function: fs_writeFile:\n--------------\nNamespace: fs_writeFile\nArguments: { path: { type: 'string' }, data: { type: 'string' } }\nDescription: This function writes data to a file. If the file does not exist, it is created. If it does exist, it is replaced.\n--------------\n\n```"
          },
        ]
      }
    };
    const functions: FunctionDefinition[] = [];

    const consoleLogger = new ConsoleLogger();
    const logger = new Logger([
      consoleLogger,
      consoleLogger
    ], {
      promptUser: async () => "",
    })
    const env = new Env(
      process.env as Record<string, string>
    );
``
    const llm = new OpenAILlmApi(
      env.OPENAI_API_KEY,
      env.GPT_MODEL as LlmModel,
      env.CONTEXT_WINDOW_TOKENS,
      env.MAX_RESPONSE_TOKENS,
      logger
    );
    const chat = new Chat(cl100k_base);

    await chat.persistent(msgs.persistent.msgs);
    await chat.temporary(msgs.temporary.msgs);

    for (let i = 0; i < 20; i++) {
      const response = await llm.getResponse(
        chat.chatLogs,
        functions.length > 0 ? functions : undefined,
        { temperature: 0.1 }
      );
      console.log(response);
    }
  }, ONE_MINUTE_TIMEOUT);
});

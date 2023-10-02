import {
  Env,
  Scripts,
  OpenAI,
  Chat,
  ContextWindow,
  LlmApi,
  ConsoleLogger,
  Logger
} from "@evo-ninja/agent-utils";
import {
  FileSystemWorkspace
} from "@evo-ninja/agent-utils-fs";
import dotenv from "dotenv";
import path from "path";
import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";
import { DevAgent } from "../DevAgent";

dotenv.config({
  path: path.join(__dirname, "../../../../.env")
});

jest.setTimeout(120000);

describe('Dev Agent Test Suite', () => {

  function createDevAgent(): DevAgent {
    const env = new Env(process.env as Record<string, string>);
    const logger = new Logger([new ConsoleLogger()], {
      promptUser: () => {
        throw Error("promptUser not supported.");
      },
      logUserPrompt: () => {
        throw Error("logUserPrompt not supported.");
      }
    });

    const llm: LlmApi = new OpenAI(
      env.OPENAI_API_KEY,
      env.GPT_MODEL,
      env.CONTEXT_WINDOW_TOKENS,
      env.MAX_RESPONSE_TOKENS,
      logger
    );

    const contextWindow = new ContextWindow(llm);
    const chat = new Chat(cl100k_base, contextWindow, logger);

    const scriptsDir = path.join(__dirname, "../../../../scripts");
    const scriptsWorkspace = new FileSystemWorkspace(
      scriptsDir
    );
    const scripts = new Scripts(scriptsWorkspace, "./");

    return new DevAgent(
      llm,
      chat,
      scripts,
      logger
    );
  }

  async function runDevAgent(agent: DevAgent, goal: string) {
    const iterator = agent.run(goal);

    while (true) {
      const response = await iterator.next();

      if (response.done) {
        return response;
      }
    }
  }

  test("tick-tack-toe in python", async () => {
    const dev = createDevAgent();
    const response = await runDevAgent(dev, "Build a tick-tack-toe game in python");

    expect(response.value.ok).toBe(true);
    console.log("look for the files")
  });
});

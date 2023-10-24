import {
  Env,
  Scripts,
  OpenAI,
  Chat,
  LlmApi,
  ConsoleLogger,
  Logger,
  SubWorkspace
} from "@evo-ninja/agent-utils";
import { FileSystemWorkspace } from "@evo-ninja/agent-utils-fs";
import { DebugLog, DebugLlmApi } from "@evo-ninja/agent-debug";
import * as rimraf from "rimraf";
import dotenv from "dotenv";
import path from "path";
import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";
import { ScripterAgent } from ".";
import { AgentContext } from "../../AgentContext";
import { LlmModel } from "@evo-ninja/agent-utils";

const rootDir = path.join(__dirname, "../../../../../");

dotenv.config({
  path: path.join(rootDir, ".env")
});

jest.setTimeout(120000);

describe('Dev Agent Test Suite', () => {

  function createAgent(testName: string): {
    agent: ScripterAgent;
    debugLog: DebugLog;
  } {
    const testCaseDir = path.join(__dirname, ".tests", testName);

    // reset the dir
    rimraf.sync(testCaseDir);

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
      env.GPT_MODEL as LlmModel,
      env.CONTEXT_WINDOW_TOKENS,
      env.MAX_RESPONSE_TOKENS,
      logger
    );

    const debugLog = new DebugLog(
      new FileSystemWorkspace(path.join(testCaseDir, "./debug"))
    );
    const debugLlm = new DebugLlmApi(debugLog, llm);

    const chat = new Chat(cl100k_base);

    const scriptsDir = path.join(rootDir, "scripts");
    const scriptsWorkspace = new FileSystemWorkspace(
      scriptsDir
    );
    const scripts = new Scripts(scriptsWorkspace, "./");

    const workspace = new FileSystemWorkspace(testCaseDir);
    const internals = new SubWorkspace(".evo", workspace);

    return {
      agent: new ScripterAgent(
        new AgentContext(
          debugLlm,
          chat,
          logger,
          workspace,
          internals,
          env,
          scripts,
        )
      ),
      debugLog
    };
  }

  async function runAgent(agent: ScripterAgent, goal: string, debugLog: DebugLog) {
    debugLog.goalStart(goal);
    const iterator = agent.run({ goal });

    while (true) {
      debugLog.stepStart();
      const response = await iterator.next();
      debugLog.stepEnd();

      if (response.done) {
        if (!response.value.ok) {
          debugLog.stepError(response.value.error ?? "Unknown error");
        } else {
          debugLog.stepLog(JSON.stringify(response.value.value));
        }
        return response;
      }
    }
  }

  test("csv-test", async () => {
    const { agent, debugLog } = createAgent("csv-test");
    const response = await runAgent(
      agent,
      "write 5 numbers of your choosing to a csv file named output.csv and sort them numerically and output that to sorted.csv",
      debugLog
    );

    expect(response.value.ok).toBe(true);
    const sourceCode = agent.workspace.readFileSync("output.csv");
    expect(sourceCode).toBeTruthy();
  });
});

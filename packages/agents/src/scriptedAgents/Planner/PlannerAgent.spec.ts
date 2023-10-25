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
import { PlannerAgent } from "..";
import * as fs from "fs";
import { AgentContext } from "../../AgentContext";
import { Agent } from "../../Agent";
import { LlmModel } from "@evo-ninja/agent-utils";

const rootDir = path.join(__dirname, "../../../../../");

dotenv.config({
  path: path.join(rootDir, ".env")
});

jest.setTimeout(120000);

describe('Planner Agent Test Suite', () => {

  function createPlannerAgent(testName: string, pathsForFilesToInclude: string[] = []): {
    agent: Agent;
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

    for (const filePath of pathsForFilesToInclude) {
      if (!fs.existsSync(filePath)) {
        throw Error(`Input file does not exist: ${filePath}`);
      }
      const fileName = path.basename(filePath);
      const fileContents = fs.readFileSync(filePath, "utf-8");
      workspace.writeFileSync(fileName, fileContents);
    }

    return {
      agent: new PlannerAgent(
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

  async function runPlannerAgent(agent: Agent, goal: string, debugLog: DebugLog) {
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

  test("AnswerQuestionSmallCsv", async () => {
    const { agent, debugLog } = createPlannerAgent(
      "AnswerQuestionSmallCsv",
      [path.join(__dirname, "testInputs/AnswerQuestionSmallCsv/file1.csv")]
    );
    const response = await runPlannerAgent(
      agent,
      "How much was spent on utilities in total ? Write the answer in an output.txt file.",
      debugLog
    );

    expect(response.value.ok).toBe(true);
  });
});

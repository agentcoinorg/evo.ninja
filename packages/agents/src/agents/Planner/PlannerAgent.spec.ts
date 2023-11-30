import {
  Chat,
  LlmApi,
  AgentContext,
  OpenAILlmApi,
  OpenAIEmbeddingAPI,
} from "@/agent-core";
import * as rimraf from "rimraf";
import dotenv from "dotenv";
import path from "path";
import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";
import * as fs from "fs";
import { LlmModel } from "@/agent-core";
import { Agent } from "../utils";
import { PlannerAgent } from ".";
import { Env, Logger, ConsoleLogger, Scripts, SubWorkspace } from "@evo-ninja/agent-utils";
import { FileSystemWorkspace } from "@evo-ninja/agent-utils-fs";
import { DebugLlmApi, DebugLog } from "@/agent-debug";

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
    });

    const llm: LlmApi = new OpenAILlmApi(
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
    const embedding = new OpenAIEmbeddingAPI(env.OPENAI_API_KEY, logger, cl100k_base);

    return {
      agent: new PlannerAgent(
        new AgentContext(
          debugLlm,
          embedding,
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

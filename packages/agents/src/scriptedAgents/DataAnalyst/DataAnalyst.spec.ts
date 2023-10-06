import {
  Env,
  Scripts,
  OpenAI,
  Chat,
  ContextWindow,
  LlmApi,
  ConsoleLogger,
  Logger,
} from "@evo-ninja/agent-utils";
import { FileSystemWorkspace } from "@evo-ninja/agent-utils-fs";
import { DebugLog, DebugLlmApi } from "@evo-ninja/agent-debug";
import * as rimraf from "rimraf";
import dotenv from "dotenv";
import path from "path";
import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";
import { ScriptedAgent } from "..";
import { DATA_ANALYST_AGENT } from "./config";

const rootDir = path.join(__dirname, "../../../../../");

dotenv.config({
  path: path.join(rootDir, ".env"),
});

jest.setTimeout(120000);

describe("Data Analyst Agent Test Suite", () => {
  function createDataAnalystAgent(testName: string): {
    agent: ScriptedAgent;
    debugLog: DebugLog;
  } {
    const testCaseDir = path.join(__dirname, ".tests", testName);

    // reset the dir
    rimraf.sync(testCaseDir, {
      filter: (path: string, _: any) => !path.includes("input.csv"),
    });

    const env = new Env(process.env as Record<string, string>);
    const logger = new Logger([new ConsoleLogger()], {
      promptUser: () => {
        throw Error("promptUser not supported.");
      },
      logUserPrompt: () => {
        throw Error("logUserPrompt not supported.");
      },
    });

    const llm: LlmApi = new OpenAI(
      env.OPENAI_API_KEY,
      env.GPT_MODEL,
      env.CONTEXT_WINDOW_TOKENS,
      env.MAX_RESPONSE_TOKENS,
      logger
    );

    const debugLog = new DebugLog(
      new FileSystemWorkspace(path.join(testCaseDir, "./debug"))
    );
    const debugLlm = new DebugLlmApi(debugLog, llm);

    const contextWindow = new ContextWindow(llm);
    const chat = new Chat(cl100k_base, contextWindow, logger);

    const scriptsDir = path.join(rootDir, "scripts");
    const scriptsWorkspace = new FileSystemWorkspace(scriptsDir);
    const scripts = new Scripts(scriptsWorkspace, "./");

    const workspace = new FileSystemWorkspace(testCaseDir);

    return {
      agent: ScriptedAgent.create(DATA_ANALYST_AGENT, {
        llm: debugLlm,
        chat,
        workspace,
        scripts,
        logger,
        env,
      }),
      debugLog,
    };
  }

  async function runDataAnalystAgent(
    agent: ScriptedAgent,
    goal: string,
    debugLog: DebugLog
  ) {
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

  test("sort-csv", async () => {
    const { agent, debugLog } = createDataAnalystAgent("sort-csv");
    const response = await runDataAnalystAgent(
      agent,
      "Sort the input.csv by the 'timestamp' column and write the new csv in the output.csv file. The order of the columns should be preserved.",
      debugLog
    );
    expect(response.value.ok).toBe(true);
    const outputCsv = agent.workspace.readFileSync("output.csv");
    expect(outputCsv).toBeTruthy();
    expect(outputCsv).toBe(`id,name,timestamp
1,Bob,2023-09-24 12:05:00
2,Charlie,2023-09-24 12:10:00
3,Alice,2023-09-25 14:10:00
4,David,2023-09-26 16:20:00
`);
  });

  test("label-csv", async () => {
    const { agent, debugLog } = createDataAnalystAgent("label-csv");
    const response = await runDataAnalystAgent(
      agent,
      "The csv 'input.csv' has many items. create a 'Color' column for these items and classify them as either 'blue', 'green', or 'yellow' depending on what the most likely color is. Preserve the order of the rows. The color column should be the second column. Write the output in output.csv",
      debugLog
    );
    expect(response.value.ok).toBe(true);
    const outputCsv = agent.workspace.readFileSync("output.csv");
    expect(outputCsv).toBeTruthy();
    console.log(outputCsv);
    expect(outputCsv).toContain(`Item,Color
Banana,Yellow
Leaf,Green
Sky,Blue
Sunflower,Yellow
Grass,Green
Jeans,Blue
Lemon,Yellow
Tree,Green
Ocean,Blue
Daisy,Yellow
Fern,Green
`);
  });

  test.only("combine-csv", async () => {
    const { agent, debugLog } = createDataAnalystAgent("combine-csv");
    const response = await runDataAnalystAgent(
      agent,
      `The csvs 'file1.csv' and 'file2.csv' both have a column 'ID'. Combine these 2 csvs using the 'ID' column. Sort the rows by ID in ascending order and the columns alphabetically. Write the output in output.csv`,
      debugLog
    );
    expect(response.value.ok).toBe(true);
    const outputCsv = agent.workspace.readFileSync("output.csv");
    expect(outputCsv).toBeTruthy();
    console.log(outputCsv);
    // expect(outputCsv).toContain();
  });
});

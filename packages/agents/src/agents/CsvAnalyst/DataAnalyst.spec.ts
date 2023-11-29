import {
  Chat,
  LlmApi,
  AgentContext, 
  LlmModel,
  OpenAILlmApi,
  OpenAIEmbeddingAPI,
} from "@/agent-core";
import * as rimraf from "rimraf";
import dotenv from "dotenv";
import path from "path";
import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";
import fs from "fs";
import { Agent } from "../utils";
import { CsvAnalystAgent } from ".";
import { Env, Logger, ConsoleLogger, Scripts, SubWorkspace } from "@evo-ninja/agent-utils";
import { FileSystemWorkspace } from "@evo-ninja/agent-utils-fs";
import { DebugLlmApi, DebugLog } from "@/agent-debug";

const rootDir = path.join(__dirname, "../../../../../");

dotenv.config({
  path: path.join(rootDir, ".env"),
});

jest.setTimeout(300000);

describe("Data Analyst Agent Test Suite", () => {
  function createDataAnalystAgent(
    testName: string,
    pathsForFilesToInclude?: string[]
  ): {
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
    const scriptsWorkspace = new FileSystemWorkspace(scriptsDir);
    const scripts = new Scripts(scriptsWorkspace, "./");

    const workspace = new FileSystemWorkspace(testCaseDir);
    const internals = new SubWorkspace(".evo", workspace);
    const embedding = new OpenAIEmbeddingAPI(env.OPENAI_API_KEY, logger, cl100k_base);

    if (pathsForFilesToInclude) {
      for (const filePath of pathsForFilesToInclude) {
        if (!fs.existsSync(filePath)) {
          throw Error(`Input file does not exist: ${filePath}`);
        }
        const fileName = path.basename(filePath);
        const fileContents = fs.readFileSync(filePath, "utf-8");
        workspace.writeFileSync(fileName, fileContents);
      }
    }

    return {
      agent: new CsvAnalystAgent(
        new AgentContext(
          debugLlm,
          embedding,
          chat,
          logger,
          workspace,
          internals,
          env,
          scripts,
        ),
      ),
      debugLog,
    };
  }

  async function runDataAnalystAgent(
    agent: Agent,
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
    const { agent, debugLog } = createDataAnalystAgent("sort-csv", [
      path.join(__dirname, "testInputs/sortCsv/input.csv"),
    ]);
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
    const { agent, debugLog } = createDataAnalystAgent("label-csv", [
      path.join(__dirname, "testInputs/labelCsv/input.csv"),
    ]);
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

  test("combine-csv", async () => {
    const { agent, debugLog } = createDataAnalystAgent("combine-csv", [
      path.join(__dirname, "testInputs/combineCsv/file1.csv"),
      path.join(__dirname, "testInputs/combineCsv/file2.csv"),
    ]);
    const response = await runDataAnalystAgent(
      agent,
      `The csvs 'file1.csv' and 'file2.csv' both have a column 'ID'. Combine these 2 csvs using the 'ID' column. Sort the rows by ID in ascending order and the columns alphabetically. Write the output in output.csv`,
      debugLog
    );
    expect(response.value.ok).toBe(true);
    const outputCsv = agent.workspace.readFileSync("output.csv");
    expect(outputCsv).toBeTruthy();
    expect(outputCsv).toContain(`Age,ID,Name,Occupation,Salary
28,101,John,Engineer,80000
34,102,Alice,Doctor,120000
45,103,Bob,Lawyer,95000`);
  });

  test("AnswerQuestionSmallCsv", async () => {
    const { agent, debugLog } = createDataAnalystAgent(
      "answer-question-small-csv",
      [path.join(__dirname, "testInputs/answerQuestionSmallCsv/file1.csv")]
    );
    const response = await runDataAnalystAgent(
      agent,
      "How much was spent on utilities in total ? Write the answer in an output.txt file.",
      debugLog
    );

    expect(response.value.ok).toBe(true);
    const result = agent.workspace.readFileSync("output.txt");
    expect(result).toContain("84");
  });

  test("AnswerQuestionCsv", async () => {
    const { agent, debugLog } = createDataAnalystAgent("answer-question-csv", [
      path.join(__dirname, "testInputs/answerQuestionCsv/file1.csv"),
    ]);
    const response = await runDataAnalystAgent(
      agent,
      "How much was spent on utilities in total ? Write the answer in an output.txt file.",
      debugLog
    );

    expect(response.value.ok).toBe(true);
    const result = agent.workspace.readFileSync("output.txt");
    expect(result).toContain("1861");
  });

  test.only("AnswerQuestionCombineCsv", async () => {
    const { agent, debugLog } = createDataAnalystAgent(
      "answer-question-combine-csv",
      [
        path.join(__dirname, "testInputs/answerQuestionCombineCsv/file1.csv"),
        path.join(__dirname, "testInputs/answerQuestionCombineCsv/file2.csv"),
      ]
    );
    const response = await runDataAnalystAgent(
      agent,
      "How much was spent on utilities in total ? Write the answer in an output.txt file.",
      debugLog
    );

    expect(response.value.ok).toBe(true);
    const result = agent.workspace.readFileSync("output.txt");
    expect(result).toContain("1861");
  });
});

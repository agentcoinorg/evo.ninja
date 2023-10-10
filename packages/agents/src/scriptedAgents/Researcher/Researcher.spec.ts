import {
  Env,
  Scripts,
  OpenAI,
  Chat,
  ContextWindow,
  LlmApi,
  ConsoleLogger,
  Logger,
  WrapClient,
  agentPlugin,
} from "@evo-ninja/agent-utils";
import { FileSystemWorkspace } from "@evo-ninja/agent-utils-fs";
import { DebugLog, DebugLlmApi } from "@evo-ninja/agent-debug";
import * as rimraf from "rimraf";
import dotenv from "dotenv";
import path from "path";
import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";
import { ResearcherAgent, ScriptedAgent } from "../..";

const rootDir = path.join(__dirname, "../../../../../");

dotenv.config({
  path: path.join(rootDir, ".env"),
});

jest.setTimeout(300000);

describe("Research Agent Test Suite", () => {
  function createResearchAgent(testName: string): {
    agent: ScriptedAgent;
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
      agent: new ResearcherAgent(
        {
          client: new WrapClient(
            workspace,
            logger,
            agentPlugin({ logger }),
            env
          ),
          llm: debugLlm,
          chat,
          workspace,
          scripts,
          logger,
          env,
        }
      ),
      debugLog
    };
  }

  async function runResearchAgent(
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

  test("search", async () => {
    const { agent, debugLog } = createResearchAgent("search");
    await runResearchAgent(
      agent,
      "Open 'https://silennaihin.com/random/plain.html' and paste all of the text on the page in a .txt file",
      debugLog
    );
    const generatedFiles = agent.workspace
      .readdirSync("./")
      .filter((f) => f.toLowerCase().includes(".txt"));
    const scrapedText = agent.workspace.readFileSync(generatedFiles[0]);
    expect(scrapedText).toBeTruthy();
    expect(scrapedText).toContain("This is a Heading");
  });

  test("basic-retrieval", async () => {
    const { agent, debugLog } = createResearchAgent("basic-retrieval");
    await runResearchAgent(
      agent,
      "Write the price of the book in this url 'http://books.toscrape.com/catalogue/meditations_33/index.html' to a .txt file.",
      debugLog
    );
    const generatedFiles = agent.workspace
      .readdirSync("./")
      .filter((f) => f.toLowerCase().includes(".txt"));
    const scrapedText = agent.workspace.readFileSync(generatedFiles[0]);
    expect(scrapedText).toBeTruthy();
    expect(scrapedText).toContain("25.89");
  });

  test("revenue-retrieval", async () => {
    const { agent, debugLog } = createResearchAgent("revenue-retrieval");
    const response = await runResearchAgent(
      agent,
      "Write tesla's exact revenue in 2022 into a .txt file. Use the US notation, with a precision rounded to the nearest million dollars (for instance, $31,578 million).",
      debugLog
    );

    expect(response.value.ok).toBe(true);
    const generatedFiles = agent.workspace
      .readdirSync("./")
      .filter(
        (f) =>
          f.toLowerCase().includes("tesla") ||
          f.toLowerCase().includes("revenue")
      );
    expect(generatedFiles).toHaveLength(1);
    const teslasRevenue = agent.workspace.readFileSync(generatedFiles[0]);
    expect(teslasRevenue).toBeTruthy();
    expect(teslasRevenue).toContain("81,462");
  });

  test("revenue-retrieval-2", async () => {
    const { agent, debugLog } = createResearchAgent("revenue-retrieval-2");
    const response = await runResearchAgent(
      agent,
      "Write tesla's revenue every year since its creation into a .txt file. Use the US notation, with a precision rounded to the nearest million dollars (for instance, $31,578 million)..",
      debugLog
    );

    expect(response.value.ok).toBe(true);
    console.log(response);
  });

  test("get information", async () => {
    const { agent, debugLog } = createResearchAgent("get information");
    const response = await runResearchAgent(
      agent,
      "Write the twitter handle of the two hosts of Latent Space to a file called output.txt",
      debugLog
    );

    expect(response.value.ok).toBe(true);
    console.log(response);
  });
});

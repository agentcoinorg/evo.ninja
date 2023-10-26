import {
  Env,
  Scripts,
  OpenAI,
  Chat,
  LlmApi,
  ConsoleLogger,
  Logger,
  SubWorkspace,
  AgentFunctionResult,
} from "@evo-ninja/agent-utils";
import { FileSystemWorkspace } from "@evo-ninja/agent-utils-fs";
import * as rimraf from "rimraf";
import dotenv from "dotenv";
import path from "path";
import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";
import { ResearcherAgent } from "../..";
import { AgentContext } from "@evo-ninja/agent-utils";
import { WebSearchFuncParameters, WebSearchFunction } from "../WebSearch";
import { LlmModel } from "@evo-ninja/agent-utils";
import { ResearcherAgent } from "../../scriptedAgents";

const rootDir = path.join(__dirname, "../../../../../");

dotenv.config({
  path: path.join(rootDir, ".env"),
});

jest.setTimeout(300000);

describe("WebSearch function", () => {
  function createWebSearchFunc(testName: string): (params: WebSearchFuncParameters) => Promise<AgentFunctionResult> {
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
      env.GPT_MODEL as LlmModel,
      env.CONTEXT_WINDOW_TOKENS,
      env.MAX_RESPONSE_TOKENS,
      logger
    );

    const chat = new Chat(cl100k_base);

    const scriptsDir = path.join(rootDir, "scripts");
    const scriptsWorkspace = new FileSystemWorkspace(scriptsDir);
    const scripts = new Scripts(scriptsWorkspace, "./");

    const workspace = new FileSystemWorkspace(testCaseDir);
    const internals = new SubWorkspace(".evo", workspace);

    const agent = new ResearcherAgent(
      new AgentContext(
        llm,
        chat,
        logger,
        workspace,
        internals,
        env,
        scripts
      )
    )

    const func = new WebSearchFunction(llm, chat.tokenizer);
    const executor = func.buildExecutor(agent)

    return (params: WebSearchFuncParameters) => executor(params, JSON.stringify(params))
  }

  test("Works", async () => {
    const websearch = createWebSearchFunc("works")

    console.time('websearch');
    const result = await websearch({
      query: "What is the annual revenue of Tesla Inc. from 2003 to 2023"
    })
    console.timeEnd('websearch')

    console.log(`Result: ${JSON.stringify(result, null, 2)}`)
  });
});

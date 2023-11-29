import * as rimraf from "rimraf";
import dotenv from "dotenv";
import path from "path";
import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";
import { WebSearchFuncParameters, WebSearchFunction } from "../WebSearch";
import { ResearcherAgent } from "../../agents";
import { AgentContext, AgentFunctionResult, Chat, LlmApi, LlmModel, OpenAILlmApi, OpenAIEmbeddingAPI } from "@/agent-core";
import { Env, Logger, ConsoleLogger, Scripts, SubWorkspace } from "@evo-ninja/agent-utils";
import { FileSystemWorkspace } from "@evo-ninja/agent-utils-fs";

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
    });

    const llm: LlmApi = new OpenAILlmApi(
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
    const embedding = new OpenAIEmbeddingAPI(env.OPENAI_API_KEY, logger, cl100k_base);

    const agent = new ResearcherAgent(
      new AgentContext(
        llm,
        embedding,
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
      queries: ["What is the annual revenue of Tesla Inc. from 2003 to 2023"]
    })
    console.timeEnd('websearch')

    console.log(`Result: ${JSON.stringify(result, null, 2)}`)
  });
});

import {
  Chat,
  LlmApi,
  LlmQuery,
  tokensToChars,
  Rag,
  Prompt,
  OpenAILlmApi,
  OpenAIEmbeddingAPI,
} from "@/agent-core";
import dotenv from "dotenv";
import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";
import path from "path";
import fs from "fs";
import { AgentContext } from "@/agent-core";
import { LlmModel } from "@/agent-core";
import { ConsoleLogger, Logger, Env, InMemoryWorkspace, Scripts, WrapClient } from "@evo-ninja/agent-utils";

dotenv.config({
  path: path.join(__dirname, "../../../../.env")
});

const maxContextChars = (llm: LlmApi): number => {
  return tokensToChars(maxContextTokens(llm));
}

const maxContextTokens = (llm: LlmApi): number => {
  return llm.getMaxContextTokens() ?? 8000;
}

describe('LLM Test Suite', () => {
  const ONE_MINUTE_TIMEOUT = 300 * 1000;

  test(`Execute`, async() => {
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

    const llm = new OpenAILlmApi(
      env.OPENAI_API_KEY,
      env.GPT_MODEL as LlmModel,
      env.CONTEXT_WINDOW_TOKENS,
      env.MAX_RESPONSE_TOKENS,
      logger
    );
    const chat = new Chat(cl100k_base);
    const embedding = new OpenAIEmbeddingAPI(env.OPENAI_API_KEY, logger, cl100k_base);

    const maxTokensToUse = maxContextTokens(llm) * 0.4;
    const tokensForPreview = maxTokensToUse * 0.7;
    const query = "The assistant should execute the function call to perform a web search for 'Tesla Inc. revenue from 2003 to 2023'.";

    const text = fs.readFileSync(__dirname + "/revenue.txt", "utf-8");

    const context = new AgentContext(llm, embedding, chat, logger, new InMemoryWorkspace(), new InMemoryWorkspace(), env, undefined as unknown as Scripts, undefined as unknown as WrapClient, undefined);

    for (let i = 0; i < 20; i++) {
      const bigPreview = await Rag.filterWithSurroundingText(
        text, 
        query, 
        context,
        {
          tokenLimit: tokensForPreview,
          surroundingCharacters: 750,
          chunkLength: 100,
          overlap: 15
        }
      );
  
      console.log("bigPreview", bigPreview);

      const prompt = new Prompt()
        .text("Assistant's next step:")
        .line(x => x.block(query))
        .line("Result:")
        .line(x => x.block(bigPreview))
        .line(`
          Imagine you are an expert content reducer. 
          Above are the snippets of the content result from the assistant's next step.
          Rewrite the content to convey the relevant information that the assistant wanted.
          Merge the snippets into a coherent content result.
          Filter out unecessary information.
          Do not summarize or add new information.
          Make sure you keep all the information and all the data that the assistant wanted.
          IMPORTANT: Respond only with the new content!"`
        ).toString();

      const outputTokens = Math.floor(maxTokensToUse * 0.25)
      console.log("Input tokens", chat.tokenizer.encode(prompt).length);
      console.log("Output tokens", outputTokens);
      
      const filteredText = await new LlmQuery(llm, chat.tokenizer).ask(prompt, { maxResponseTokens: outputTokens });
      console.log("filteredText", filteredText);
    }
  }, ONE_MINUTE_TIMEOUT);
});

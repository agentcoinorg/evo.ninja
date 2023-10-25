import {
  OpenAI,
  Chat,
  ConsoleLogger,
  Logger,
  Env,
  LlmApi,
  InMemoryWorkspace,
  Scripts,
  WrapClient,
  LlmQuery
} from "@evo-ninja/agent-utils";
import dotenv from "dotenv";
import cl100k_base from "gpt-tokenizer/cjs/encoding/cl100k_base";
import path from "path";
import { Prompt } from "../agents/Chameleon/Prompt";
import { Rag } from "../agents/Chameleon/Rag";
import { charsToTokens, previewChunks, tokensToChars } from "../agents/Chameleon/helpers";
import fs from "fs";
import { AgentContext } from "../AgentContext";
import { LlmModel } from "@evo-ninja/agent-utils";

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
      logUserPrompt: (response: string) => {
        consoleLogger.info(`#User:\n${response}`);
      }
    })
    const env = new Env(
      process.env as Record<string, string>
    );

    const llm = new OpenAI(
      env.OPENAI_API_KEY,
      env.GPT_MODEL as LlmModel,
      env.CONTEXT_WINDOW_TOKENS,
      env.MAX_RESPONSE_TOKENS,
      logger
    );
    const chat = new Chat(cl100k_base);

    const maxCharsToUse = maxContextChars(llm) * 0.4;
    const charsForPreview = maxCharsToUse * 0.7;
    const query = "The assistant should execute the function call to perform a web search for 'Tesla Inc. revenue from 2003 to 2023'.";

    const text = fs.readFileSync(__dirname + "/revenue.txt", "utf-8");

    const context = new AgentContext(llm, chat, logger, new InMemoryWorkspace(), new InMemoryWorkspace(), env, undefined as unknown as Scripts, undefined as unknown as WrapClient, undefined);

    for (let i = 0; i < 20; i++) {
      const bigPreview = await Rag.filterWithSurroundingText(
        text, 
        query, 
        context,
        {
          charLimit: charsForPreview,
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

      const outputTokens = charsToTokens(maxCharsToUse * 0.25);
      console.log("Input tokens", chat.tokenizer.encode(prompt).length);
      console.log("Output tokens", outputTokens);
      
      const filteredText = await new LlmQuery(llm, chat.tokenizer).ask(prompt, { maxResponseTokens: outputTokens });
      console.log("filteredText", filteredText);
    }
  }, ONE_MINUTE_TIMEOUT);
});

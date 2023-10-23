import { Agent } from "../../Agent";
import { AgentContext } from "../../AgentContext";
import { AgentConfig } from "../../AgentConfig";
import { WebSearchFunction } from "../../functions/WebSearch";
import { PlanWebResearchFunction } from "../../functions/PlanWebResearch";
import { ScrapeTextFunction } from "../../functions/ScrapeText";
import { prompts } from "./prompts";
import { ReadFileFunction } from "../../functions/ReadFile";
import { WriteFileFunction } from "../../functions/WriteFile";

export class WebResearcherAgent extends Agent {
  constructor(context: AgentContext) {
    super(
      new AgentConfig(
        () => prompts,
        [
          new PlanWebResearchFunction(context.llm, context.chat.tokenizer),
          // new VerifyResearchFunction(context.llm, context.chat.tokenizer),
          // new SearchInPagesFunction(
          //   new HTMLChunker({ maxChunkSize: 5000 }),
          //   context.chat.tokenizer,
          //   context.llm,
          //   {
          //     connect: async () => connect({
          //       uri:  `./db/lance`,
          //     }),
          //     embeddingFunction: (column) => new OpenAIEmbeddingFunction(column, context.env.OPENAI_API_KEY)
          //   }
          // ),
          new WebSearchFunction(),
          new ScrapeTextFunction(),
          new ReadFileFunction(context.scripts),
          new WriteFileFunction(context.scripts),
        ],
        context.scripts
      ),
      context
    );
  }
}

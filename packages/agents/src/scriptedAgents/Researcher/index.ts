import { WriteFileFunction } from "../../functions/WriteFile";
import { WebSearchFunction } from "../../functions/WebSearch";
import { PlanResearchFunction } from "../../functions/PlanResearch";
import { ScrapeTextFunction } from "../../functions/ScrapeText";
import { prompts } from "./prompts";
import { AgentContext } from "../../AgentContext";
import { ReadFileFunction } from "../../functions/ReadFile";
import { Agent } from "../../Agent";
import { AgentConfig } from "../../AgentConfig";

export class ResearcherAgent extends Agent {
  constructor(context: AgentContext) {
    super(
      new AgentConfig(
        () => prompts,
        [
          new WriteFileFunction(context.scripts),
          new ReadFileFunction(context.scripts),
          new PlanResearchFunction(context.llm, context.chat.tokenizer),
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
          new ScrapeTextFunction()
        ], 
        context.scripts,
      ),
      context
    );
  }
}

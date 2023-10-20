import { WebSearchFunction } from "../../functions/WebSearch";
import { SearchInPagesFunction } from "../../functions/SearchInPages";
import { PlanWebResearchFunction } from "../../functions/PlanWebResearch";
import { VerifyResearchFunction } from "../../functions/VerifyResearch";
import { ScrapeTextFunction } from "../../functions/ScrapeText";
import { AgentWithGoal } from "../../AgentWithGoal";
import { ScriptedAgentRunArgs } from "../ScriptedAgent";
import { AgentBaseContext } from "../../AgentBase";
import { prompts } from "./prompts";

import { HTMLChunker } from "@evo-ninja/agent-utils";
import { OpenAIEmbeddingFunction, connect } from "vectordb";

export class WebResearcherAgent extends AgentWithGoal<ScriptedAgentRunArgs> {
  constructor(context: AgentBaseContext) {

    const scrapeTextFunc = new ScrapeTextFunction(context.scripts)

    super(
      () => prompts,
      [
        new PlanWebResearchFunction(context.llm, context.chat.tokenizer),
        new VerifyResearchFunction(context.llm, context.chat.tokenizer),
        new SearchInPagesFunction(
          new HTMLChunker({ maxChunkSize: 5000 }),
          context.chat.tokenizer,
          context.llm,
          {
            connect: async () => connect({
              uri:  `./db/lance`,
            }),
            embeddingFunction: (column) => new OpenAIEmbeddingFunction(column, context.env.OPENAI_API_KEY)
          }
        ),
        new WebSearchFunction(),
        scrapeTextFunc
      ],
      context
    );
  }
}

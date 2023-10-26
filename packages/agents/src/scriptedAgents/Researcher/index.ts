import { Agent } from "../../Agent";
import { AgentContext } from "@evo-ninja/agent-utils";
import { AgentConfig } from "../../AgentConfig";
import { WebSearchFunction } from "../../functions/WebSearch";
import { PlanWebResearchFunction } from "../../functions/PlanWebResearch";
import { prompts } from "./prompts";
import { ReadFileFunction } from "../../functions/ReadFile";
import { WriteFileFunction } from "../../functions/WriteFile";
import { ScrapeTableFunction } from "../../functions/ScrapeTable";
import { ScrapeTextFunction } from "../../functions/ScrapeText";

export class ResearcherAgent extends Agent {
  constructor(context: AgentContext) {
    super(
      new AgentConfig(
        () => prompts,
        [
          new PlanWebResearchFunction(context.llm, context.chat.tokenizer),
          new WebSearchFunction(context.llm, context.chat.tokenizer),
          new ScrapeTableFunction(),
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

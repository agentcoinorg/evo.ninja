import { Agent, GoalRunArgs } from "../../Agent";
import { AgentContext, Chat } from "@evo-ninja/agent-utils";
import { AgentConfig } from "../../AgentConfig";
import { WebSearchFunction } from "../../functions/WebSearch";
import { PlanWebResearchFunction } from "../../functions/PlanWebResearch";
import { prompts } from "./prompts";
import { ReadFileFunction } from "../../functions/ReadFile";
import { WriteFileFunction } from "../../functions/WriteFile";
import { ScrapeTableFunction } from "../../functions/ScrapeTable";
import { ScrapeTextFunction } from "../../functions/ScrapeText";

export class ResearcherAgent extends Agent {
  private plan: PlanWebResearchFunction;

  constructor(context: AgentContext) {
    super(
      new AgentConfig(
        () => prompts,
        [
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
    this.plan = new PlanWebResearchFunction(context.llm, context.chat.tokenizer);
  }

  public override async onFirstRun(args: GoalRunArgs, chat: Chat): Promise<void> {
    await this.executeFunction(this.plan, args, chat);
  }
}

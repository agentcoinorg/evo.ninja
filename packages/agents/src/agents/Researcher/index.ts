import { AgentContext, Chat } from "@/agent-core";
import { WebSearchFunction } from "../../functions/WebSearch";
import { PlanWebResearchFunction } from "../../functions/PlanWebResearch";
import { prompts } from "./prompts";
import { ReadFileFunction } from "../../functions/ReadFile";
import { WriteFileFunction } from "../../functions/WriteFile";
import { ScrapeTextFunction } from "../../functions/ScrapeText";
import { Agent, AgentConfig, GoalRunArgs } from "../utils";

export class ResearcherAgent extends Agent {
  private plan: PlanWebResearchFunction;

  constructor(context: AgentContext) {
    super(
      new AgentConfig(
        () => prompts,
        [
          new WebSearchFunction(context.llm, context.chat.tokenizer),
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

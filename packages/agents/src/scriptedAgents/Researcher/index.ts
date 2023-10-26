import { Agent, GoalRunArgs } from "../../Agent";
import { AgentContext, executeAgentFunction, agentFunctionBaseToAgentFunction, Chat } from "@evo-ninja/agent-utils";
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
    this.plan = new PlanWebResearchFunction(context.llm, context.chat.tokenizer);
  }

  public override async onFirstRun(args: GoalRunArgs, chat: Chat): Promise<void> {
    // TODO: this is duplicated from basicFunctionCallLoop, should be generalized into a utility
    const fn = agentFunctionBaseToAgentFunction(this)(this.plan);
    const { result } = await executeAgentFunction([args, fn], JSON.stringify(args), this.context);

    // Save large results as variables
    for (const message of result.messages) {
      if (message.role !== "function") {
        continue;
      }
      const functionResult = message.content || "";
      if (result.storeInVariable || this.context.variables.shouldSave(functionResult)) {
        const varName = this.context.variables.save(this.plan.name, functionResult);
        message.content = `\${${varName}}`;
      }
    }

    result.messages.forEach(x => chat.temporary(x));
  }
}

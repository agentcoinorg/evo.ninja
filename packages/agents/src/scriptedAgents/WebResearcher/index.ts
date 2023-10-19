import {
  ScriptedAgent,
  ScriptedAgentConfig,
  ScriptedAgentContext,
} from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { HTMLChunker } from "@evo-ninja/agent-utils";
import { WebSearchFunction } from "../../functions/WebSearch";
import { SearchInPagesFunction } from "../../functions/SearchInPages";
import { PlanWebResearchFunction } from "../../functions/PlanWebResearch";
import { VerifyResearchFunction } from "../../functions/VerifyResearch";
import { ScrapeTextFunction } from "../../functions/ScrapeText";
import { OpenAIEmbeddingFunction, connect } from "vectordb";
import { prompts } from "./prompts";

export class WebResearcherAgent extends ScriptedAgent {
  constructor(context: ScriptedAgentContext) {

    const onGoalAchievedFn = new OnGoalAchievedFunction(
      context.client,
      context.scripts
    );

    const onGoalFailedFn = new OnGoalFailedFunction(
      context.client,
      context.scripts
    );

    const scrapeTextFunc = new ScrapeTextFunction(context.client, context.scripts)

    const config: ScriptedAgentConfig = {
      functions: [
        onGoalAchievedFn,
        onGoalFailedFn,
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
      shouldTerminate: (functionCalled) => {
        return [onGoalAchievedFn.name, onGoalFailedFn.name].includes(
          functionCalled.name
        );
      },
      prompts,
    };

    super(config, context);
  }
}

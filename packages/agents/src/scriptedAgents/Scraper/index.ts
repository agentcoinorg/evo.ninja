import {
  ScriptedAgent,
  ScriptedAgentConfig,
  ScriptedAgentContext,
} from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { SearchFunction } from "../../functions/Search";
import { FuzzySearchFunction } from "../../functions/FuzzySearch";
// import { Chat } from "@evo-ninja/agent-utils";
// import { DelegateAgentFunction } from "../../functions/DelegateScriptedAgent";
// import { ResearchVerifierAgent } from "../ResearchVerifier";

export class ScraperAgent extends ScriptedAgent {
  constructor(context: ScriptedAgentContext) {
    const AGENT_NAME = "Scraper";

    const onGoalAchievedFn = new OnGoalAchievedFunction(
      context.client,
      context.scripts
    );

    const onGoalFailedFn = new OnGoalFailedFunction(
      context.client,
      context.scripts
    );

    const config: ScriptedAgentConfig = {
      name: AGENT_NAME,
      expertise:
        "Excels at web searching and scraping data from web pages.",
      initialMessages: ({ goal }) => [
        {
          role: "user",
          content: `
You are an advanced web searcher and web page scraper. You will receive a query, and context, and need to search the web to find its answer.

You will follow these steps:

1. Search the web for results, like you would search on Google. The results are ordered by relevance, so the first results may yield better results than later ones.
 If none of the results seem like they could contain relevant information, repeat the search with different terms.

 If a web_search result already contains relevant and sufficient information, you don't need to fuzzy search or scrape the web page.
2. If needed, fuzzy search for relevant information in a specific web page, using precise keywords that you think will literally appear in the text you are looking for.
 if the results are not satisfactory, try scaping a different page from the results of step 1.

Prioritize accuracy. Do not settle for the first piece of information found if there are more precise results available
  Example: "population of New York in 2020" and you get the following results: ["1.5 million",  "nearly 1.600.000", "1,611,989"], you will take "1,611,989"
`,
        },
        { role: "user", content: goal },
      ],
      loopPreventionPrompt:
        "Assistant, you appear to be in a loop, try executing a different function.",
      functions: [
        onGoalAchievedFn,
        onGoalFailedFn,
        new SearchFunction(context.client, context.scripts),
        new FuzzySearchFunction(context.client, context.scripts),
        // new ScrapeTextFunction(context.client, context.scripts),
      ],
      shouldTerminate: (functionCalled) => {
        return [onGoalAchievedFn.name, onGoalFailedFn.name].includes(
          functionCalled.name
        );
      },
    };

    super(config, context);
  }
}

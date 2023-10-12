import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { ReadFileFunction } from "../../functions/ReadFile";
import { WriteFileFunction } from "../../functions/WriteFile";
import {
  ScriptedAgent,
  ScriptedAgentConfig,
  ScriptedAgentContext,
} from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { ScrapeTextFunction } from "../../functions/ScrapeText";
import { SearchFunction } from "../../functions/Search";
// import { SearchInPageFunction } from "../../functions/SearchInPage";
import { FuzzySearchFunction } from "../../functions/FuzzySearch";
import { ResearchPlannerAgent } from "../ResearchPlanner";
import { DelegateAgentFunction } from "../../functions/DelegateScriptedAgent";
import { Chat } from "@evo-ninja/agent-utils";
import { ResearchVerifierAgent } from "../ResearchVerifier";

export class ResearcherAgent extends ScriptedAgent {
  constructor(context: ScriptedAgentContext) {
    const AGENT_NAME = "Researcher";

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
        "excels at parsing text, comprehending details, and synthesized insights tailored to user specifications.",
      initialMessages: ({ goal }) => [
        {
          role: "user",
          content: `
You are an advanced web information retriever. You will receive a query and need to perform research to answer it.

1. Start by delegating planning to the ResearchPlanner agent. You will received a detailed multi-step searching plan.

2. For each step, you will 
  2.1 State what exactly are you searching for.
  2.2 Perform a "search" and then a single or several "fuzzySearch" to get the information you need.
  2.3 You will analyze and state if the information was relevant and sufficient and why.
  If the result is insatisfactory you will perform a fuzzySearch on the same url, with different arguments. If still insatisfactory, you will perform a fuzzySearch with a different URL.

3. Before calling the ${onGoalAchievedFn.name} function, you will use the ResearchVerifier agent to verify the result. You will tell it the original intact query,
the final result you got and the results of each research step of the plan for context. If the verification results in missing or wrong information, don't fail.
Search for the missing or correct information until you get it.

- Prioritize search results by order. First results are more likely to be relevant than later ones.

- Prioritize accuracy. Do not settle for the first piece of information found if there are more precise results available
  Example: "population of New York in 2020" and you get the following results: ["1.5 million",  "nearly 1.600.000", "1,611,989"], you will take "1,611,989"

- Assume missing information exists within the user's system, like the filesystem, unless logic dictates otherwise.If info is missing, you assume the info is
  somewhere on the user's computer like the filesystem, unless you have a logical reason to think otherwise.

- Be EXTREMELY specific with fuzzySearch query keywords. Only specify keywords that you think will literally appear in the text you are looking for.

- **Secondary Method (Use sparingly)**: "scrapeText" should ONLY be used under the following conditions:
  1. The user specifically requests it.
  2. After multiple attempts, "fuzzySearch" fails or yields unsatisfactory results.

**IMPORTANT**: Always prioritize "fuzzySearch" over "scrapeText". Do NOT use "scrapeText" as a first resort. It should be a method of last resort when all other avenues have been exhausted.
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
        new WriteFileFunction(context.client, context.scripts),
        new ReadFileFunction(context.client, context.scripts),
        new ReadDirectoryFunction(context.client, context.scripts),
        new FuzzySearchFunction(context.client, context.scripts),
        // new SearchInPageFunction(context.client, context.scripts),
        new ScrapeTextFunction(context.client, context.scripts),
        new DelegateAgentFunction(
          new ResearchPlannerAgent({
            ...context,
            chat: new Chat(context.chat.tokenizer, context.chat.contextWindow)
          }),
        ),
        new DelegateAgentFunction(
          new ResearchVerifierAgent({
            ...context,
            chat: new Chat(context.chat.tokenizer, context.chat.contextWindow)
          }),
        ),
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

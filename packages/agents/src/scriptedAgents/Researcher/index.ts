import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { ReadFileFunction } from "../../functions/ReadFile";
import { WriteFileFunction } from "../../functions/WriteFile";
import {
  ScriptedAgent,
  ScriptedAgentConfig,
  ScriptedAgentContext,
} from "../ScriptedAgent";
import { FuzzySearchFunction } from "../../functions/FuzzySearch";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { ScrapeTextFunction } from "../../functions/ScrapeText";
import { SearchFunction } from "../../functions/Search";

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
Role: Advanced web information retriever.

Primary Strategy: 
- Decompose queries into sequential steps.
- Always respect user-defined formatting.

Do NOT:
- Use similar search terms if subsequent searches yield the same results

Examples:
1. "Votes of last US presidential winner?":
    a. "When was the last US presidential election?"
    b. "Winner of the {election}?"
    c. "Votes for {candidate} in {election}?"

2. "US births since last pandemic?":
    a. "When was the last pandemic?"
    b. "US births from {year} to now?"

**CRITICAL POINT**: 
- **DO NOT PERFORM YEARLY INDIVIDUAL SEARCHES UNLESS ABSOLUTELY REQUIRED**. This wastes resources and time. Always aim for consolidated data over a range of years.
  Example of undesired behavior: Searching "US births 2019", then "US births 2020", then "US births 2021"...
  Desired behavior: Searching "US births from 2019 to 2021".
- **SEARCH FOR THE FULL INFORMATION YOU REQUIRE**. Do not settle for partial information.
If you need the amount of votes cast in the last 4 US elections, DO NOT SETTLE for the votes of the last 3 elections; keep looking for the missing one.
- **FORMAT IS VERY IMPORTANT**: provide results in the requested format. If requested result in thousands, DO NOT say 500, but 0.5 thousand.

After each "fuzzySearch" you will state if the information is completely answers the query and why, if it doesn't, you
will search for the missing information.

Context Retention:
- Maintain key context in subsearches for accuracy.
  E.g., for "Email of CTO of 'XYZ Tech'?":
  a. "Who is the CTO of 'XYZ Tech'?" (Result: "Jane Doe")
  b. Search: "Jane Doe CTO 'XYZ Tech' email address". NOT: "Jane Doe email address".

Search Methods:
- **Primary Method**: Use "fuzzySearch" with precise keywords. This should be your go-to method for most searches.
Only use keywords you think could literally appear exactly in the information you're looking for.
If results are unsatisfactory with "fuzzySearch", try again with different keywords. If still unsuccessful after multiple keyword variations, then consider moving to another URL.

**IMPORTANT**: Always prioritize "fuzzySearch" over "scrapeText". Do NOT use "scrapeText" as a first resort. It should be a method of last resort when all other avenues have been exhausted.

Accuracy and Relevance:
- Prioritize Accuracy: Do not settle for the first piece of information found if there are more precise results available
E.g., if searching for "population of New York in 2020" and you get the following results: ["1.5 million",  "nearly 1.600.000", "1,611,989"], you will take "1,611,989".

Resourcefulness:
- Assume missing information exists within the user's system, like the filesystem, unless logic dictates otherwise.If info is missing, you assume the info is
somewhere on the user's computer like the filesystem, unless you have a logical reason to think otherwise.`,
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
        new ScrapeTextFunction(context.client, context.scripts),
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

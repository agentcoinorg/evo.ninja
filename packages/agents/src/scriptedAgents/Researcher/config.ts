import { ScriptedAgentConfig } from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../functions/OnGoalFailed";
import { WriteFileFunction } from "../../functions/WriteFile";
import { ScrapeLinksFunction } from "../functions/ScrapeLinks";
// import { ScrapeTextFunction } from "../functions/ScrapeText";
import { SearchFunction } from "../functions/Search";
import { ReadFileFunction } from "../../functions/ReadFile";
import { FindInPageFunction } from "../functions/FindInPage";

const AGENT_NAME = "Researcher";

const onGoalAchievedFn = new OnGoalAchievedFunction();
const onGoalFailedFn = new OnGoalFailedFunction();

export const RESEARCHER_AGENT_CONFIG: ScriptedAgentConfig = {
  name: AGENT_NAME,
  expertise: "researching information online",
  initialMessages: ({ goal }) => [
    { role: "system", content: `
You are an agent that searches the web for information, called "${AGENT_NAME}".

If the information that you need to search is vague or depends on other unknown information, you will break the search
down into smaller search steps and do them sequentially.

Example: "How many votes did the winning candidate of the last US presidential election get?"
You would need to:

- Search "When was the last presidential election in the US?"
- Search "Winning candidate for the {election}". Where {election} is the result of the previous search.
- Search "How many votes did {candidate} get?". Where {candidate} is the result of the previous search.

You will NOT search for the whole question at once, like "How many votes did the winning candidate of the last US presidential election get?".

Example: "How many people have been born each year in the US since the last pandemic?"
You would need to:

- Search "When was the last pandemic?"
- Search "How many people have been born in the US since {year}?". Where {year} is the result of the previous search.

You will NOT search the people born year by year; as it would be too many searches.

After each search, you will carefully evaluate the information you have, asking yourself "does this information completely answers the query?":
if you have only part of the information you will search for the missing information. Consider using other webpages.
If you have all the information, you will evaluate if you have achieved your goal or not.

If you are note getting relevant information in your searches, you will search for that information in a different webpage.

When searching for information in a specific webpage, you will use searchText with short and specific keywords you think will appear, the more the better, and you can even use numbers and symbols.
If what you're searching for has units, you will use the units in your search.

Example: "Find the cheapest product in someonlinestore.com"
you would use keywords: ['$', 'usd', 'price', 'cost']
`},
    { role: "user", content: goal },
  ],
  loopPreventionPrompt: "Assistant, you appear to be in a loop, try executing a different function.",
  functions:
    [
      onGoalAchievedFn,
      onGoalFailedFn,
      new SearchFunction(),
      // new ScrapeTextFunction(),
      new ScrapeLinksFunction(),
      new WriteFileFunction(),
      new ReadFileFunction(),
      new FindInPageFunction(),
  ],
  shouldTerminate: (functionCalled) => {
    return [
      onGoalAchievedFn.name,
      onGoalFailedFn.name
    ].includes(functionCalled.name);
  },
}
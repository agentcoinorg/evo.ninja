import { ScriptedAgentConfig } from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../functions/OnGoalFailed";
import { WriteFileFunction } from "../../functions/WriteFile";
import { ScrapeLinksFunction } from "../functions/ScrapeLinks";
// import { ScrapeTextFunction } from "../functions/ScrapeText";
import { SearchFunction } from "../functions/Search";
import { FindInPageFunction } from "../functions/FindInPage";

const AGENT_NAME = "Researcher";

const onGoalAchievedFn = new OnGoalAchievedFunction();
const onGoalFailedFn = new OnGoalFailedFunction();

export const RESEARCHER_AGENT_CONFIG: ScriptedAgentConfig = {
  name: AGENT_NAME,
  expertise: "researching information online",
  initialMessages: ({ goal }) => [
    { role: "assistant", content: `I am an agent that searches the web for information, called "${AGENT_NAME}".\n` +
    `Only scrape if you're certain the information you're looking for isn't available in the result of search.\n` +
    `If findInPage fails, try other keywords before giving up.\n`},
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
      new FindInPageFunction(),
      new WriteFileFunction()
  ],
  shouldTerminate: (functionCalled) => {
    return [
      onGoalAchievedFn.name,
      onGoalFailedFn.name
    ].includes(functionCalled.name);
  },
}
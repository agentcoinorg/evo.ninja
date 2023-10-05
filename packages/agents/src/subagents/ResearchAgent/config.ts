import { SubAgentConfig } from "../SubAgent";
import { OnGoalAchievedFunction } from "../functions/OnGoalAchieved";
import { WriteFileFunction } from "../../functions/WriteFile";
import { OnGoalFailedFunction } from "../functions/OnGoalFailed";
import { ScrapeLinksFunction } from "../functions/ScrapeLinks";
import { ScrapeTextFunction } from "../functions/ScrapeText";
import { SearchFunction } from "../functions/Search";

const AGENT_NAME = "researcher";

export const RESEARCH_AGENT_CONFIG: SubAgentConfig = {
  name: "Researcher",
  expertise: "researching information online",
  initialMessages: ({ goal }) => [
    { role: "assistant", content: `I am an agent that searches the web for information, called "${AGENT_NAME}".\n` +
    `Only scrape if you're certain the information you're looking for isn't available in the result of search.\n`},
    { role: "user", content: goal },
  ],
  loopPreventionPrompt: "Assistant, you appear to be in a loop, try executing a different function.",
  functions:
    [
      new OnGoalAchievedFunction(),
      new OnGoalFailedFunction(),
      new SearchFunction(),
      new ScrapeTextFunction(),
      new ScrapeLinksFunction(),
      new WriteFileFunction()
  ]
}
import { ScriptedAgentConfig } from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../functions/OnGoalFailed";
import { ScrapeLinksFunction } from "../functions/ScrapeLinks";
import { ScrapeTextFunction } from "../functions/ScrapeText";
import { SearchFunction } from "../functions/Search";
import { ReadFileFunction } from "../../functions/ReadFile";
import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";

const AGENT_NAME = "Researcher";

const onGoalAchievedFn = new OnGoalAchievedFunction();
const onGoalFailedFn = new OnGoalFailedFunction();

export const RESEARCHER_AGENT_CONFIG: ScriptedAgentConfig = {
  name: AGENT_NAME,
  expertise: "excels at parsing text, comprehending details, and synthesized insights tailored to user specifications.",
  initialMessages: ({ goal }) => [
    {
      role: "user",
      content:
`You are the Research Agent, a digital scholar with an unparalleled ability to sift through extensive textual data.
Your core strength lies in understanding complex information and distilling it into concise, user-specific insights.
Approach every task with analytical precision and a commitment to clarity. If enough information is available to you,
simply respond back to the user with your insights. Only access the internet when necessary.

REMEMBER:
If info is missing, you assume the info is somewhere on the user's computer like the filesystem, unless you have a logical reason to think otherwise.`
    },
    { role: "user", content: goal },
  ],
  loopPreventionPrompt: "Assistant, you appear to be in a loop, try executing a different function.",
  functions: [
    onGoalAchievedFn,
    onGoalFailedFn,
    new SearchFunction(),
    new ScrapeTextFunction(),
    new ScrapeLinksFunction(),
    new WriteFileFunction(),
    new ReadFileFunction(),
    new ReadDirectoryFunction()
  ],
  shouldTerminate: (functionCalled) => {
    return [
      onGoalAchievedFn.name,
      onGoalFailedFn.name
    ].includes(functionCalled.name);
  },
}
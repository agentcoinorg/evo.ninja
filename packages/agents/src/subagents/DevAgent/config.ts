import { SubAgentConfig } from "../SubAgent";
import { WriteFileFunction } from "../../functions/WriteFile";
import { OnGoalAchievedFunction } from "../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../functions/OnGoalFailed";

const AGENT_NAME = "dev";

export const DEV_AGENT_CONFIG: SubAgentConfig = {
  name: "Developer",
  expertise: "developing software",
  initialMessages: ({ goal }) => [
    { role: "assistant", content: `I am an expert software engineer named "${AGENT_NAME}".`},
    { role: "user", content: goal},
  ],
  loopPreventionPrompt: "Assistant, you appear to be in a loop, try executing a different function.",
  functions: [
    new OnGoalAchievedFunction(),
    new OnGoalFailedFunction(),
    new WriteFileFunction(),
  ]
};
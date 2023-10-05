import { ScriptedAgentConfig } from "../ScriptedAgent";
import { WriteFileFunction } from "../../functions/WriteFile";
import { OnGoalAchievedFunction } from "../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../functions/OnGoalFailed";

const AGENT_NAME = "Developer";

const onGoalAchievedFn = new OnGoalAchievedFunction();
const onGoalFailedFn = new OnGoalFailedFunction();

export const DEVELOPER_AGENT_CONFIG: ScriptedAgentConfig = {
  name: AGENT_NAME,
  expertise: "Building software projects of one or more files.",
  initialMessages: ({ goal }) => [
    { role: "assistant", content: `I am an expert software engineer named "${AGENT_NAME}".`},
    { role: "user", content: goal},
  ],
  loopPreventionPrompt: "Assistant, you appear to be in a loop, try executing a different function.",
  functions: [
    new OnGoalAchievedFunction(),
    new OnGoalFailedFunction(),
    new WriteFileFunction(),
  ],
  shouldTerminate: (functionCalled) => {
    return [
      onGoalAchievedFn.name,
      onGoalFailedFn.name
    ].includes(functionCalled.name);
  },
};
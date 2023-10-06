import { ScriptedAgentConfig } from "../ScriptedAgent";
import { WriteFileFunction } from "../../functions/WriteFile";
import { OnGoalAchievedFunction } from "../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../functions/OnGoalFailed";
import { ReadFileFunction } from "../../functions/ReadFile";

const AGENT_NAME = "Developer";

const onGoalAchievedFn = new OnGoalAchievedFunction();
const onGoalFailedFn = new OnGoalFailedFunction();
const writeFileFn = new WriteFileFunction();

export const DEVELOPER_AGENT_CONFIG: ScriptedAgentConfig = {
  name: AGENT_NAME,
  expertise: "Building software projects with one or more files.",
  initialMessages: ({ goal }) => [
    { 
      role: "system", 
      content: `Purpose:
You are an expert developer assistant that excels at coding related tasks.
You plan and write clean and effective code to files using the ${writeFileFn.name} function.`
    },
    { role: "user", content: goal},
  ],
  loopPreventionPrompt: "Assistant, you appear to be in a loop, try executing a different function.",
  functions: [
    new OnGoalAchievedFunction(),
    new OnGoalFailedFunction(),
    new WriteFileFunction(),
    new ReadFileFunction(),
  ],
  shouldTerminate: (functionCalled) => {
    return [
      onGoalAchievedFn.name,
      onGoalFailedFn.name
    ].includes(functionCalled.name);
  },
};
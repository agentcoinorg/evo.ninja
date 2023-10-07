import { ScriptedAgentConfig } from "../ScriptedAgent";
import { WriteFileFunction } from "../../functions/WriteFile";
import { OnGoalAchievedFunction } from "../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../functions/OnGoalFailed";
import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";

const AGENT_NAME = "Developer";

const onGoalAchievedFn = new OnGoalAchievedFunction();
const onGoalFailedFn = new OnGoalFailedFunction();
const writeFileFn = new WriteFileFunction();
const readFileFn = new ReadFileFunction();

export const DEVELOPER_AGENT_CONFIG: ScriptedAgentConfig = {
  name: AGENT_NAME,
  expertise: "Building software projects with one or more files.",
  constraintMessages: () => [
    { 
      role: "user", 
      content: `Purpose:
You are an expert developer assistant that excels at coding related tasks.
You have access to the file system using the ${writeFileFn.name} and ${readFileFn.name} functions.
You plan and write clean and effective code to files using the ${writeFileFn.name} function.
You must not interact with the user or ask question for clarification. Solve the task to the best of your abilities.`
    }
  ],
  persistentMessages: ({ goal }) => [
    { role: "user", content: goal},
  ],
  loopPreventionPrompt: "Assistant, you appear to be in a loop, try executing a different function.",
  functions: [
    new OnGoalAchievedFunction(),
    new OnGoalFailedFunction(),
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
};
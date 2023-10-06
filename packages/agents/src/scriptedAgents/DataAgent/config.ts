import { ScriptedAgentConfig } from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../functions/OnGoalAchieved";
// import { OnGoalFailedFunction } from "../functions/OnGoalFailed";
import { SortCsvFunction } from "../functions/SortCsv";
// import { SortCsvColumnFunction } from "../functions/SortCsvColumn";
// import { ThinkFunction } from "../../functions/Think";
// import { WriteFileFunction } from "../../functions/WriteFile";
// import { ReadFileFunction } from "../../functions/ReadFile";

const AGENT_NAME = "data_analist";

const onGoalAchievedFn = new OnGoalAchievedFunction();
const onGoalFailedFn = new OnGoalAchievedFunction();

export const DATA_ANALYST_AGENT: ScriptedAgentConfig = {
  name: "DataAnalist",
  expertise: "analyze data and retrieve conclusions from it",
  initialMessages: ({ goal }) => [
    { role: "assistant", content: `I am an agent that analyzes data, called "${AGENT_NAME}".\n` +
    `I have a workspace from which I can read and write files, which I am going to use to store and manipulate data. This will help me to retrieve\n` +
    `the conclusions asked by the user .\n`},
    { role: "user", content: goal },
  ],
  loopPreventionPrompt: "Assistant, you appear to be in a loop, try executing a different function.",
  functions:
    [
      // new OnGoalAchievedFunction(),
      // new OnGoalFailedFunction(),
      new SortCsvFunction(),
      // new SortCsvColumnFunction(),
      // new ReadFileFunction(),
      // new WriteFileFunction(),
      // new ThinkFunction(),
  ],
  shouldTerminate: (functionCalled) => {
    return [
      onGoalAchievedFn.name,
      onGoalFailedFn.name
    ].includes(functionCalled.name);
  },
}
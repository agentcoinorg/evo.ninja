import { ScriptedAgentConfig } from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../functions/OnGoalFailed";
import { SortCsvFunction } from "../functions/SortCsv";
import { SortCsvColumnFunction } from "../functions/SortCsvColumn";
import { ThinkFunction } from "../../functions/Think";
import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadFileFunction } from "../../functions/ReadFile";
import { AddCsvColumnFunction } from "../functions/AddCsvColumn";
import { JoinCsvFunction } from "../functions/JoinCsv";

const AGENT_NAME = "data_analyst";

const onGoalAchievedFn = new OnGoalAchievedFunction();
const onGoalFailedFn = new OnGoalAchievedFunction();

export const DATA_ANALYST_AGENT: ScriptedAgentConfig = {
  name: "DataAnalyst",
  expertise: "analyze data and retrieve conclusions from it",
  initialMessages: ({ goal }) => [
    { role: "assistant", content: `I am an agent that analyzes data, called "${AGENT_NAME}".\n` +
    `I also possess a wide range of general knowledge about various objects and their common
    properties. Using my knowledge, I can make decisions about data and apply transformations.
    I have a workspace from which I can read and write files, which I will use to store, retrieve, and manipulate data. I carefully consider my actions step by step 
    before executing them.`},
    { role: "user", content: goal },
  ],
  loopPreventionPrompt: "Assistant, you appear to be in a loop, try executing a different function.",
  functions: [
    new OnGoalAchievedFunction(),
    new OnGoalFailedFunction(),
    new SortCsvFunction(),
    new SortCsvColumnFunction(),
    new AddCsvColumnFunction(),
    new ReadFileFunction(),
    new WriteFileFunction(),
    new ThinkFunction(),
    new JoinCsvFunction()
  ],
  shouldTerminate: (functionCalled) => {
    return [
      onGoalAchievedFn.name,
      onGoalFailedFn.name
    ].includes(functionCalled.name);
  },
}
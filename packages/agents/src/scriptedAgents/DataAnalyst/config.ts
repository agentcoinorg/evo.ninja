import { ScriptedAgentConfig } from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../functions/OnGoalFailed";
import { SortCsvFunction } from "../functions/SortCsv";
import { SortCsvColumnsFunction } from "../functions/SortCsvColumns";
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
  expertise: "handles CSV files to analyze data and retrieve conclusions from it",
  initialMessages: ({ goal }) => [
    { role: "system", content: `You are an agent that analyzes data, called "${AGENT_NAME}".\n` +
    `You have a workspace from which you can read and write files, which you will use to store, retrieve,
    and manipulate data - If you're asked to execute any task and you don't know how to get some information, 
    is very likely that some files from the workspace are useful. \n
    You also possess a wide range of general knowledge about various objects and their common properties
    so you can come up with an answer when needed. Also feel free to come up with a criteria that is not clear\n`},
    { role: "user", content: goal },
  ],
  loopPreventionPrompt: "Assistant, you appear to be in a loop, try executing a different function.",
  functions: [
    new OnGoalAchievedFunction(),
    new OnGoalFailedFunction(),
    new SortCsvFunction(),
    new SortCsvColumnsFunction(),
    new AddCsvColumnFunction(),
    new ReadFileFunction(),
    new WriteFileFunction(),
    new ThinkFunction(),
    new JoinCsvFunction(),
    // new GetWorkspaceFiles()
  ],
  shouldTerminate: (functionCalled) => {
    return [
      onGoalAchievedFn.name,
      onGoalFailedFn.name
    ].includes(functionCalled.name);
  },
}
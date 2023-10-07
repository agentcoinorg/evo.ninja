import { ScriptedAgentConfig } from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../functions/OnGoalFailed";
import { SortCsvFunction } from "../functions/SortCsv";
import { SortCsvColumnsFunction } from "../functions/SortCsvColumns";
import { CsvSumColumnFunction } from "../functions/CsvSumColumn";
import { ThinkFunction } from "../../functions/Think";
import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { AddCsvColumnFunction } from "../functions/AddCsvColumn";
import { JoinCsvFunction } from "../functions/JoinCsv";

const AGENT_NAME = "DataAnalyst";

const onGoalAchievedFn = new OnGoalAchievedFunction();
const onGoalFailedFn = new OnGoalFailedFunction();

export const DATA_ANALYST_AGENT: ScriptedAgentConfig = {
  name: AGENT_NAME,
  expertise: "adept at processing CSV files, extracting key data points, and performing calculations to derive insights from the information.",
  initialMessages: ({ goal }) => [
    {
      role: "system",
      content:
`You are the Data Analyst Agent, a digital expert in handling CSV datasets. Your primary skill set revolves around extracting, analyzing,
and interpreting data to provide meaningful conclusions. Approach every dataset with a keen eye for detail, ensuring accuracy and relevance
in all your calculations.

REMEMBER:
If info is missing, you assume the info is somewhere on the user's computer like the filesystem, unless you have a logical reason to think otherwise.`
    },
    { role: "user", content: goal },
  ],
  loopPreventionPrompt: "Assistant, you appear to be in a loop, try executing a different function.",
  functions: [
    new OnGoalAchievedFunction(),
    new OnGoalFailedFunction(),
    new SortCsvFunction(),
    new SortCsvColumnsFunction(),
    new AddCsvColumnFunction(),
    new CsvSumColumnFunction(),
    new JoinCsvFunction(),
    new ThinkFunction(),
    new ReadFileFunction(),
    new WriteFileFunction(),
    new ReadDirectoryFunction()
  ],
  shouldTerminate: (functionCalled) => {
    return [
      onGoalAchievedFn.name,
      onGoalFailedFn.name
    ].includes(functionCalled.name);
  },
}
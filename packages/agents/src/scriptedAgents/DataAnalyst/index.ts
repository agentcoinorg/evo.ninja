import {
  ScriptedAgent,
  ScriptedAgentConfig,
  ScriptedAgentContext,
} from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { AnalyzeFormattingRequirementsFunction } from "../../functions/AnalyzeFormattingRequirements";
import { AnalyzeDataFunction } from "../../functions/AnalyzeData";
import { CsvAddColumnFunction } from "../../functions/CsvAddColumn";
import { CsvFilterRowsFunction } from "../../functions/CsvFilterRows";
import { CsvJoinByColumnFunction } from "../../functions/CsvJoinByColumn";
import { CsvOrderColumnsFunction } from "../../functions/CsvOrderColumns";
import { CsvSortByColumnFunction } from "../../functions/CsvSortByColumn";
import { CsvSumColumnFunction } from "../../functions/CsvSumColumn";
import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { ThinkFunction } from "../../functions/Think";

export class DataAnalystAgent extends ScriptedAgent {
  constructor(context: ScriptedAgentContext) {
    const onGoalAchievedFn = new OnGoalAchievedFunction(
      context.client,
      context.scripts
    );
    const onGoalFailedFn = new OnGoalFailedFunction(
      context.client,
      context.scripts
    );

    const AGENT_NAME = "DataAnalyst";

    const config: ScriptedAgentConfig = {
      name: AGENT_NAME,
      expertise: "adept at processing CSV files, extracting key data points, and performing calculations to derive insights from the information.",
      initialMessages: ({ goal }) => [
        {
          role: "user",
          content:
`You are the Data Analyst Agent, an expert analyzing and modifying CSV datasets. You must perform the following steps:

0. Understand Requirements - Understand all requirements of your task by calling the analyzeFormattingRequirements function. These requirements MUST be respected in all future actions.
1. Read - Read all relevant data files. If no files were provided, try to fs_readDirectory to find relevant files.
2. Analyze - Data that is too large must be analyzed first. You must know what is contained within the data.
3. Modify - Modify the data based on the requirements AND analysis you've done prior. Each modification you make NEEDS to have justification, stating how it abides by the requirements of the goal.`
        },
        { role: "user", content: goal },
      ],
      loopPreventionPrompt: "Assistant, you appear to be in a loop, try executing a different function.",
      agentSpeakPrompt:
    `You do not communicate with the user. If you have insufficient information, it may exist somewhere in the user's filesystem.
    Use the "fs_readDirectory" function to try and discover this missing information.`,
      functions: [
        onGoalAchievedFn,
        onGoalFailedFn,
        new AnalyzeFormattingRequirementsFunction(context.llm, context.chat.tokenizer),
        new AnalyzeDataFunction(context.llm, context.chat.tokenizer),
        new CsvAddColumnFunction(context.client, context.scripts),
        new CsvFilterRowsFunction(context.client, context.scripts),
        new CsvJoinByColumnFunction(context.client, context.scripts),
        new CsvOrderColumnsFunction(context.client, context.scripts),
        new CsvSortByColumnFunction(context.client, context.scripts),
        new CsvSumColumnFunction(context.client, context.scripts),
        new ReadFileFunction(context.client, context.scripts, 1000),
        new WriteFileFunction(context.client, context.scripts),
        new ReadDirectoryFunction(context.client, context.scripts),
        new ThinkFunction()
      ],
      shouldTerminate: (functionCalled) => {
        return [onGoalAchievedFn.name, onGoalFailedFn.name].includes(
          functionCalled.name
        );
      },
    };

    super(config, context);
  }
}

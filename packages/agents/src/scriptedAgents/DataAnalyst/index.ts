import {
  ScriptedAgent,
  ScriptedAgentConfig,
  ScriptedAgentContext,
} from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { SortCsvFunction } from "../../functions/SortCsv";
import { SortCsvColumnsFunction } from "../../functions/SortCsvColumns";
import { CsvSumColumnFunction } from "../../functions/CsvSumColumn";
import { CsvFilterRowsFunction } from "../../functions/CsvFilterRows";
import { ThinkFunction } from "../../functions/Think";
import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { AddCsvColumnFunction } from "../../functions/AddCsvColumn";
import { JoinCsvFunction } from "../../functions/JoinCsv";

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
    `You are the Data Analyst Agent, a digital expert in handling CSV datasets. Your primary skill set revolves around extracting,
    analyzing, and interpreting data to provide meaningful conclusions. Approach every dataset with a keen eye for detail, ensuring
    accuracy and relevance in all your calculations.

    Formatting is very important. If a user defines how they want data to be formatted, respect this always within your outputs.
    You do not communicate with the user. If you have insufficient information, it may exist somewhere in the user's filesystem.
    Use the "fs_readDirectory" function to try and discover this missing information.`
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
        new SortCsvFunction(context.client, context.scripts),
        new SortCsvColumnsFunction(context.client, context.scripts),
        new AddCsvColumnFunction(context.client, context.scripts),
        new CsvSumColumnFunction(context.client, context.scripts),
        new CsvFilterRowsFunction(context.client, context.scripts),
        new JoinCsvFunction(context.client, context.scripts),
        new ThinkFunction(),
        new ReadFileFunction(context.client, context.scripts),
        new WriteFileFunction(context.client, context.scripts),
        new ReadDirectoryFunction(context.client, context.scripts),
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

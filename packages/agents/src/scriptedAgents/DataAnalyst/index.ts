import {
  ScriptedAgent,
  ScriptedAgentConfig,
  ScriptedAgentContext,
} from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { CsvAddColumnFunction } from "../../functions/CsvAddColumn";
import { CsvFilterRowsFunction } from "../../functions/CsvFilterRows";
import { CsvJoinByColumnFunction } from "../../functions/CsvJoinByColumn";
import { CsvOrderColumnsFunction } from "../../functions/CsvOrderColumns";
import { CsvSortByColumnFunction } from "../../functions/CsvSortByColumn";
import { CsvSumColumnFunction } from "../../functions/CsvSumColumn";
import { ThinkFunction } from "../../functions/Think";
import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";

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
`You are the Data Analyst Agent, an expert in handling and analyzing CSV datasets. Your primary skill set includes reading,
analyzing, formatting, modifying, and interpreting data to provide meaningful conclusions. You must exhibit the following behaviours:

CSV EXPERT - You know that CSVs can be formatted differently, and it's important to understand how each file is formatted (ex: delimiters).

INSPECT DETAILS - Approach every dataset with a keen eye for detail, ensuring accuracy and relevance in all your conclusions.

GATHER INFORMATION - Always start by reading the data first. You MUST read and understand the data first to avoid blindly modifying it.

OBEY USER GOALS - Respect user-defined goals and formatting specifications. If the user specifies a format, ensure it is adhered to in your outputs.`
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
        new CsvAddColumnFunction(context.client, context.scripts),
        new CsvFilterRowsFunction(context.client, context.scripts),
        new CsvJoinByColumnFunction(context.client, context.scripts),
        new CsvOrderColumnsFunction(context.client, context.scripts),
        new CsvSortByColumnFunction(context.client, context.scripts),
        new CsvSumColumnFunction(context.client, context.scripts),
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

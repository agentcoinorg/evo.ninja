import {
  ScriptedAgent,
  ScriptedAgentConfig,
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
import { prompts } from "./prompts";
import { AgentBaseContext } from "../../AgentBase";

export class DataAnalystAgent extends ScriptedAgent {
  constructor(context: AgentBaseContext) {
    const onGoalAchievedFn = new OnGoalAchievedFunction(context.scripts);
    const onGoalFailedFn = new OnGoalFailedFunction(context.scripts);
    const config: ScriptedAgentConfig = {
      functions: [
        onGoalAchievedFn,
        onGoalFailedFn,
        new AnalyzeFormattingRequirementsFunction(context.llm, context.chat.tokenizer),
        new AnalyzeDataFunction(context.llm, context.chat.tokenizer),
        new CsvAddColumnFunction(context.scripts),
        new CsvFilterRowsFunction(context.scripts),
        new CsvJoinByColumnFunction(context.scripts),
        new CsvOrderColumnsFunction(context.scripts),
        new CsvSortByColumnFunction(context.scripts),
        new CsvSumColumnFunction(context.scripts),
        new ReadFileFunction(context.scripts, 1000),
        new WriteFileFunction(context.scripts),
        new ReadDirectoryFunction(context.scripts),
        new ThinkFunction()
      ],
      shouldTerminate: (functionCalled) => {
        return [onGoalAchievedFn.name, onGoalFailedFn.name].includes(
          functionCalled.name
        );
      },
      prompts
    };

    super(config, context);
  }
}

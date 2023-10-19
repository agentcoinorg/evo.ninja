import {
  ScriptedAgentRunArgs,
} from "../ScriptedAgent";
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
import { AgentWithGoal } from "../../AgentWithGoal";

export class DataAnalystAgent extends AgentWithGoal<ScriptedAgentRunArgs> {
  constructor(context: AgentBaseContext) {
    super(
      () => prompts,
      [
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
      context
    );
  }
}

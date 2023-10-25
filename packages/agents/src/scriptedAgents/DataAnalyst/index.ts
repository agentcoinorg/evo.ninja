import { AnalyzeFormattingRequirementsFunction } from "../../functions/AnalyzeFormattingRequirements";
import { CsvAddColumnFunction } from "../../functions/CsvAddColumn";
import { CsvFilterRowsFunction } from "../../functions/CsvFilterRows";
import { CsvJoinByColumnFunction } from "../../functions/CsvJoinByColumn";
import { CsvOrderColumnsFunction } from "../../functions/CsvOrderColumns";
import { CsvSortByColumnFunction } from "../../functions/CsvSortByColumn";
import { CsvSumColumnFunction } from "../../functions/CsvSumColumn";
import { ReadAndAnalyzeDataFunction } from "../../functions/ReadAndAnalyzeData";
import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { prompts } from "./prompts";
import { AgentContext } from "../../AgentContext";
import { AgentConfig } from "../../AgentConfig";
import { Agent } from "../../Agent";

export class DataAnalystAgent extends Agent {
  constructor(context: AgentContext) {
    super(
      new AgentConfig(
        () => prompts,
        [
          new AnalyzeFormattingRequirementsFunction(context.llm, context.chat.tokenizer),
          new CsvAddColumnFunction(context.scripts),
          new CsvFilterRowsFunction(context.scripts),
          new CsvJoinByColumnFunction(context.scripts),
          new CsvOrderColumnsFunction(context.scripts),
          new CsvSortByColumnFunction(context.scripts),
          new CsvSumColumnFunction(context.scripts),
          new ReadAndAnalyzeDataFunction(),
          new WriteFileFunction(context.scripts),
          new ReadDirectoryFunction(context.scripts),
        ],
        context.scripts,
      ),
      context
    );
  }
}

import { UnderstandDataFunction } from "../../functions/UnderstandData";
import { CsvAddColumnFunction } from "../../functions/CsvAddColumn";
import { CsvFilterRowsFunction } from "../../functions/CsvFilterRows";
import { CsvJoinByColumnFunction } from "../../functions/CsvJoinByColumn";
import { CsvOrderColumnsFunction } from "../../functions/CsvOrderColumns";
import { CsvSortByColumnFunction } from "../../functions/CsvSortByColumn";
import { CsvSumColumnFunction } from "../../functions/CsvSumColumn";
import { WriteFileFunction } from "../../functions/WriteFile";
import { prompts } from "./prompts";
import { AgentContext, Chat } from "@/agent-core";
import { Agent, AgentConfig, GoalRunArgs } from "../utils";

export class CsvAnalystAgent extends Agent {
  private understand: UnderstandDataFunction;

  constructor(context: AgentContext) {
    super(
      new AgentConfig(
        () => prompts,
        [
          new CsvAddColumnFunction(context.scripts, true),
          new CsvFilterRowsFunction(context.scripts, true),
          new CsvJoinByColumnFunction(context.scripts, true),
          new CsvOrderColumnsFunction(context.scripts, true),
          new CsvSortByColumnFunction(context.scripts, true),
          new CsvSumColumnFunction(context.scripts, true),
          new WriteFileFunction(context.scripts)
        ],
        context.scripts,
      ),
      context
    );
    this.understand = new UnderstandDataFunction();
  }

  public override async onFirstRun(args: GoalRunArgs, chat: Chat): Promise<void> {
    // await this.executeFunction(this.understand, args, chat);
  }
}

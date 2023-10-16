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
import * as prompts from "./prompts";

const AGENT_NAME = "DataAnalyst";

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
    const config: ScriptedAgentConfig = {
      name: AGENT_NAME,
      expertise: prompts.EXPERTISE,
      initialMessages: prompts.INITIAL_MESSAGES,
      loopPreventionPrompt: prompts.LOOP_PREVENTION_PROMPT,
      agentSpeakPrompt: prompts.AGENT_SPEAK_PROMPT,
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

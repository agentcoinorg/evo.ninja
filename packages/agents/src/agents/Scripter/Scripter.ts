import { AgentBase, AgentBaseConfig, AgentBaseContext } from "../../AgentBase";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { CreateScriptFunction } from "../../functions/CreateScript";
import { ExecuteScriptFunction } from "../../functions/ExecuteScript";
import { FindScriptFunction } from "../../functions/FindScript";
import { ReadVariableFunction } from "../../functions/ReadVariable";
import { ReadFileFunction } from "../../functions/ReadFile";
import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { prompts } from "./prompts";

export interface ScripterRunArgs {
  goal: string
}

export class Scripter extends AgentBase<ScripterRunArgs, AgentBaseContext> {
  constructor(
    context: AgentBaseContext,
  ) {
    const onGoalAchievedFn = new OnGoalAchievedFunction(context.scripts);
    const onGoalFailedFn = new OnGoalFailedFunction(context.scripts);

    const config: AgentBaseConfig<ScripterRunArgs> = {
      functions: [
        new CreateScriptFunction(context.llm, context.chat.tokenizer),
        new ExecuteScriptFunction(),
        new FindScriptFunction(context.scripts),
        new ReadVariableFunction(),
        new ReadFileFunction(context.scripts),
        new WriteFileFunction(context.scripts),
        new ReadDirectoryFunction(context.scripts),
        onGoalAchievedFn,
        onGoalFailedFn,
      ],
      shouldTerminate: (functionCalled) => {
        return [onGoalAchievedFn.name, onGoalFailedFn.name].includes(
          functionCalled.name
        );
      },
      prompts,
    };

    super(config, context);
  }
}

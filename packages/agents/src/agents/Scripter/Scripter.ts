import { AgentBase, AgentBaseConfig } from "../../AgentBase";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { CreateScriptFunction } from "../../functions/CreateScript";
import { ExecuteScriptFunction } from "../../functions/ExecuteScript";
import { FindScriptFunction } from "../../functions/FindScript";
import { ReadVariableFunction } from "../../functions/ReadVariable";
import { ReadFileFunction } from "../../functions/ReadFile";
import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { ScriptedAgentContext } from "../../scriptedAgents";
import { prompts } from "./prompts";

export interface ScripterRunArgs {
  goal: string
}

export class Scripter extends AgentBase<ScripterRunArgs, ScriptedAgentContext> {
  constructor(
    context: ScriptedAgentContext,
  ) {
    const onGoalAchievedFn = new OnGoalAchievedFunction(context.client, context.scripts);
    const onGoalFailedFn = new OnGoalFailedFunction(context.client, context.scripts);

    const config: AgentBaseConfig<ScripterRunArgs> = {
      functions: [
        new CreateScriptFunction(context.scripts),
        new ExecuteScriptFunction(context.client, context.scripts),
        new FindScriptFunction(context.scripts),
        new ReadVariableFunction(),
        new ReadFileFunction(context.client, context.scripts),
        new WriteFileFunction(context.client, context.scripts),
        new ReadDirectoryFunction(context.client, context.scripts),
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

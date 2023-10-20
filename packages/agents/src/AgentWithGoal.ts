import { AgentPrompts, AgentBaseContext, AgentBase, AgentBaseConfig } from "./AgentBase";
import { AgentFunctionBase } from "./AgentFunctionBase";
import { OnGoalAchievedFunction } from "./functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "./functions/OnGoalFailed";

export class AgentWithGoal<TRunArgs> extends AgentBase<TRunArgs, AgentBaseContext> {
  constructor(
    promptFactory: ( 
      onGoalAchievedFn: AgentFunctionBase<any>,
      onGoalFailedFn: AgentFunctionBase<any>,
    ) => AgentPrompts<TRunArgs>, 
    functions: AgentFunctionBase<unknown>[], 
    context: AgentBaseContext
  ) {

    const onGoalAchievedFn = new OnGoalAchievedFunction(context.scripts);
    const onGoalFailedFn = new OnGoalFailedFunction(context.scripts);

    const config: AgentBaseConfig<TRunArgs> = {
      functions:
        [
          onGoalAchievedFn,
          onGoalFailedFn,
          ...functions,
      ],
      shouldTerminate: (functionCalled) => {
        return [
          onGoalAchievedFn.name,
          onGoalFailedFn.name
        ].includes(functionCalled.name);
      },
      prompts: promptFactory(onGoalAchievedFn, onGoalFailedFn)
    };

    super(config, context);
  }
}

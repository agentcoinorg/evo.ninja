import { Scripts, Timeout } from "@evo-ninja/agent-utils";
import { OnGoalAchievedFunction, OnGoalFailedFunction } from "../../functions";
import { AgentFunctionBase } from "../../functions/utils";
import { AgentPrompts } from "./AgentPrompts";
import { ExecuteAgentFunctionCalled } from "@/agent-core";

export class AgentConfig<TRunArgs> {
  readonly shouldTerminate: (functionCalled: ExecuteAgentFunctionCalled) => boolean;
  readonly prompts: AgentPrompts<TRunArgs>;

  constructor(
    promptFactory: (
      onGoalAchievedFn: AgentFunctionBase<any>,
      onGoalFailedFn: AgentFunctionBase<any>
    ) => AgentPrompts<TRunArgs>,
    public readonly functions: AgentFunctionBase<unknown>[],
    scripts: Scripts,
    public readonly timeout?: Timeout,
    shouldTerminate?: (functionCalled: ExecuteAgentFunctionCalled) => boolean,
    overrideDefaultFunctions?: boolean,
  ) {
    const onGoalAchievedFn = new OnGoalAchievedFunction(scripts);
    const onGoalFailedFn = new OnGoalFailedFunction(scripts);
    // Default functions that are added to every agent
    const defaultFunctions = !overrideDefaultFunctions 
      ? [
        onGoalAchievedFn,
        onGoalFailedFn,
      ] 
      : [];

    // See which functions already exist
    const existingFunctions = new Map(
      functions.map((x) => ([x.name, x]))
    );

    // Add defaults if they don't already exist
    functions.push(
      ...defaultFunctions.filter(x => !existingFunctions.has(x.name))
    );

    this.shouldTerminate = shouldTerminate ?? ((functionCalled) => {
      return [
        onGoalAchievedFn.name,
        onGoalFailedFn.name,
      ].includes(functionCalled.name);
    });

    this.prompts = promptFactory(onGoalAchievedFn, onGoalFailedFn);
  }
}

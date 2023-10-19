import {
  ScriptedAgentRunArgs,
} from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { prompts } from "./prompts";
import { AgentBase, AgentBaseConfig, AgentBaseContext } from "../../AgentBase";

export class PlannerAgent extends AgentBase<ScriptedAgentRunArgs, AgentBaseContext> {
  constructor(context: AgentBaseContext) {
    const onGoalAchievedFn = new OnGoalAchievedFunction(context.scripts);

    const config: AgentBaseConfig<ScriptedAgentRunArgs> = {
      functions: [onGoalAchievedFn],
      shouldTerminate: (functionCalled) => {
        return [onGoalAchievedFn.name].includes(functionCalled.name);
      },
      prompts: prompts(onGoalAchievedFn)
    };

    super(config, context);
  }
}

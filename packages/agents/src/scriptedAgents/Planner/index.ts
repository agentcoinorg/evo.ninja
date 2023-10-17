import {
  ScriptedAgent,
  ScriptedAgentConfig,
  ScriptedAgentContext,
} from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { prompts } from "./prompts";

export class PlannerAgent extends ScriptedAgent {
  constructor(context: ScriptedAgentContext) {
    const onGoalAchievedFn = new OnGoalAchievedFunction(
      context.client,
      context.scripts
    );

    const config: ScriptedAgentConfig = {
      functions: [onGoalAchievedFn],
      shouldTerminate: (functionCalled) => {
        return [onGoalAchievedFn.name].includes(functionCalled.name);
      },
      prompts: prompts(onGoalAchievedFn)
    };

    super(config, context);
  }
}

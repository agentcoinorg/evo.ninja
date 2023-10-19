import {
  ScriptedAgent,
  ScriptedAgentConfig,
} from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { prompts } from "./prompts";
import { AgentBaseContext } from "../../AgentBase";

export class PlannerAgent extends ScriptedAgent {
  constructor(context: AgentBaseContext) {
    const onGoalAchievedFn = new OnGoalAchievedFunction(context.scripts);

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

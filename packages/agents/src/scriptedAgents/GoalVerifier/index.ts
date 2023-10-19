import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { ReadFileFunction } from "../../functions/ReadFile";
import {
  ScriptedAgent,
  ScriptedAgentConfig,
} from "../ScriptedAgent";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { prompts } from "./prompts";
import { AgentBaseContext } from "../../AgentBase";

export class GoalVerifierAgent extends ScriptedAgent {
  constructor(context: AgentBaseContext) {

    const onGoalAchievedFn = new OnGoalAchievedFunction(context.scripts);
    const onGoalFailedFn = new OnGoalFailedFunction(context.scripts);

    const config: ScriptedAgentConfig = {
      functions:
        [
          onGoalAchievedFn,
          onGoalFailedFn,
          new ReadFileFunction(context.scripts),
          new ReadDirectoryFunction(context.scripts),
      ],
      shouldTerminate: (functionCalled) => {
        return [
          onGoalAchievedFn.name,
          onGoalFailedFn.name
        ].includes(functionCalled.name);
      },
      prompts: prompts(onGoalAchievedFn, onGoalFailedFn)
    };

    super(config, context);
  }
}

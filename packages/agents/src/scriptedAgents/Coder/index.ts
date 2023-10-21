import { WriteFileFunction } from "../../functions/WriteFile";
import { AgentContext } from "../../AgentContext";
import { Agent } from "../../Agent";
import { AgentConfig } from "../../AgentConfig";
import { prompts } from "./prompts";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";

export class CoderAgent extends Agent {
  constructor(context: AgentContext) {
    const writeFileFn = new WriteFileFunction(context.scripts);
    const onGoalAchieved = new OnGoalAchievedFunction(context.scripts);

    super(
      new AgentConfig(
        () => prompts(writeFileFn, onGoalAchieved),
        [
          writeFileFn,
        ], 
        context.scripts
      ),
      context
    );
  }
}

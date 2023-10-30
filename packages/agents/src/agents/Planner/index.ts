import { prompts } from "./prompts";
import { AgentContext } from "@evo-ninja/agent-utils";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { Agent, AgentConfig } from "../utils";

export class PlannerAgent extends Agent {
  constructor(context: AgentContext) {
    const onGoalAchievedFn = new OnGoalAchievedFunction(context.scripts);
    super(
      new AgentConfig(
        (onGoalAchievedFn) => prompts(onGoalAchievedFn),
        [
          onGoalAchievedFn,
        ],
        context.scripts,
        undefined,
        (functionCalled) => functionCalled.name === onGoalAchievedFn.name,
        true
      ), 
      context
    );
  }
}

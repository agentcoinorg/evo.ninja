import { prompts } from "./prompts";
import { AgentContext } from "../../AgentContext";
import { Agent } from "../../Agent";
import { AgentConfig } from "../../AgentConfig";

export class PlannerAgent extends Agent {
  constructor(context: AgentContext) {
    super(
      new AgentConfig(
        (onGoalAchievedFn) => prompts(onGoalAchievedFn),
        [],
        context.scripts,
      ), 
      context
    );
  }
}

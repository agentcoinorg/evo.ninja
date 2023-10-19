import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { ReadFileFunction } from "../../functions/ReadFile";
import { AgentBaseContext } from "../../AgentBase";
import { AgentWithGoal } from "../../AgentWithGoal";
import { ScriptedAgentRunArgs } from "../ScriptedAgent";
import { prompts } from "./prompts";

export class GoalVerifierAgent extends AgentWithGoal<ScriptedAgentRunArgs> {
  constructor(context: AgentBaseContext) {
    super(
      prompts,
      [
        new ReadFileFunction(context.scripts),
        new ReadDirectoryFunction(context.scripts),
      ], 
      context
    );
  }
}

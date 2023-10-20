import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { ThinkFunction } from "../../functions/Think";
import { AgentBaseContext } from "../../AgentBase";
import { AgentWithGoal } from "../../AgentWithGoal";
import { ScriptedAgentRunArgs } from "../ScriptedAgent";
import { prompts } from "./prompts";

export class ScribeAgent extends AgentWithGoal<ScriptedAgentRunArgs> {
  constructor(context: AgentBaseContext) {

    super(
      () => prompts,
      [
        new WriteFileFunction(context.scripts),
        new ReadFileFunction(context.scripts),
        new ReadDirectoryFunction(context.scripts),
        new ThinkFunction()
      ],
      context
    );
  }
}

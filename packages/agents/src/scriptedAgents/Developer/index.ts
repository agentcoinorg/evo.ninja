import { ScriptedAgentRunArgs } from "../ScriptedAgent";
import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { prompts } from "./prompts";
import { RunAndAnalysePythonTestFunction } from "../../functions/RunAndAnalysePythonTest";
import { AgentBaseContext } from "../../AgentBase";
import { AgentWithGoal } from "../../AgentWithGoal";

export class DeveloperAgent extends AgentWithGoal<ScriptedAgentRunArgs> {
  constructor(context: AgentBaseContext) {
    const writeFileFn = new WriteFileFunction(context.scripts);
    const readFileFn = new ReadFileFunction(context.scripts);
    super(
      () => prompts(writeFileFn, readFileFn),
      [
        writeFileFn,
        readFileFn,
        new ReadDirectoryFunction(context.scripts),
        new RunAndAnalysePythonTestFunction(),
      ], 
      context
    );
  }
}

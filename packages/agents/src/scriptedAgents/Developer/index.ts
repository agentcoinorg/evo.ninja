import { ScriptedAgent, ScriptedAgentConfig } from "../ScriptedAgent";
import { WriteFileFunction } from "../../functions/WriteFile";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { prompts } from "./prompts";
import { RunAndAnalysePythonTestFunction } from "../../functions/RunAndAnalysePythonTest";
import { AgentBaseContext } from "../../AgentBase";

export class DeveloperAgent extends ScriptedAgent {
  constructor(context: AgentBaseContext) {
    const onGoalAchievedFn = new OnGoalAchievedFunction(context.scripts);
    const onGoalFailedFn = new OnGoalFailedFunction(context.scripts);
    const writeFileFn = new WriteFileFunction(context.scripts);
    const readFileFn = new ReadFileFunction(context.scripts);
    const readDirectoryFn = new ReadDirectoryFunction(context.scripts);
    const pythonTestAnalyserFn = new RunAndAnalysePythonTestFunction();

    const config: ScriptedAgentConfig = {
      functions: [
        onGoalAchievedFn,
        onGoalFailedFn,
        writeFileFn,
        readFileFn,
        readDirectoryFn,
        pythonTestAnalyserFn
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
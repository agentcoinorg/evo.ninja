import { ScriptedAgent, ScriptedAgentConfig, ScriptedAgentContext } from "../ScriptedAgent";
import { WriteFileFunction } from "../../functions/WriteFile";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { prompts } from "./prompts";
import { RunAndAnalysePythonTestFunction } from "../../functions/RunAndAnalysePythonTest";
import { DevelopmentPlanner } from "../../functions/DevelopmentPlanner";

export class DeveloperAgent extends ScriptedAgent {
  constructor(context: ScriptedAgentContext) {
    const onGoalAchievedFn = new OnGoalAchievedFunction(context.client, context.scripts);
    const onGoalFailedFn = new OnGoalFailedFunction(context.client, context.scripts);
    const writeFileFn = new WriteFileFunction(context.client, context.scripts);
    const readFileFn = new ReadFileFunction(context.client, context.scripts);
    const readDirectoryFn = new ReadDirectoryFunction(context.client, context.scripts);
    const pythonTestAnalyserFn = new RunAndAnalysePythonTestFunction();
    const developmentPlannerFn = new DevelopmentPlanner(context.llm, context.chat.tokenizer);

    const config: ScriptedAgentConfig = {
      functions: [
        onGoalAchievedFn,
        onGoalFailedFn,
        writeFileFn,
        readFileFn,
        readDirectoryFn,
        pythonTestAnalyserFn,
        developmentPlannerFn
      ],
      shouldTerminate: (functionCalled) => {
        return [
          onGoalAchievedFn.name,
          onGoalFailedFn.name
        ].includes(functionCalled.name);
      },
      prompts: prompts(onGoalAchievedFn, onGoalFailedFn, developmentPlannerFn)
    };

    super(config, context);
  }
}
import { ScriptedAgent, ScriptedAgentConfig, ScriptedAgentContext } from "../ScriptedAgent";
import { WriteFileFunction } from "../../functions/WriteFile";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { prompts } from "./prompts";
import { RunAndAnalysePythonTestFunction } from "../../functions/RunAndAnalysePythonTest";
import { CodeFunction } from "../../functions/Code";
import { AnalyzeWorkspaceFunction } from "../../functions/AnalyzeWorkspace";
import { AnalyzeCodeFunction } from "../../functions/AnalyzeCode";

export class DeveloperAgent extends ScriptedAgent {
  constructor(context: ScriptedAgentContext) {
    const onGoalAchievedFn = new OnGoalAchievedFunction(context.client, context.scripts);
    const onGoalFailedFn = new OnGoalFailedFunction(context.client, context.scripts);
    const writeFileFn = new WriteFileFunction(context.client, context.scripts);
    const readFileFn = new ReadFileFunction(context.client, context.scripts);
    const readDirectoryFn = new ReadDirectoryFunction(context.client, context.scripts);
    const pythonTestAnalyserFn = new RunAndAnalysePythonTestFunction();

    const config: ScriptedAgentConfig = {
      functions: [
        new CodeFunction(context.llm, context.chat.tokenizer),
        // new AnalyzeWorkspaceFunction(context.llm, context.chat.tokenizer),
        new AnalyzeCodeFunction(context.llm, context.chat.tokenizer),
        onGoalAchievedFn,
        // onGoalFailedFn,
        writeFileFn,
        readFileFn,
        // readDirectoryFn,
        // pythonTestAnalyserFn,
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
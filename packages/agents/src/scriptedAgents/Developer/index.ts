import { ScriptedAgent, ScriptedAgentConfig, ScriptedAgentContext } from "../ScriptedAgent";
import { WriteFileFunction } from "../../functions/WriteFile";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { prompts } from "./prompts";
import { RunAndAnalysePythonTestFunction } from "../../functions/RunAndAnalysePythonTest";
import {SummarizeDirectoryFunction} from "../../functions/SummarizeDirectory";
import {InitPoetryFunction} from "../../functions/InitPoetry";

export class DeveloperAgent extends ScriptedAgent {
  constructor(context: ScriptedAgentContext) {
    const onGoalAchievedFn = new OnGoalAchievedFunction(context.client, context.scripts);
    const onGoalFailedFn = new OnGoalFailedFunction(context.client, context.scripts);
    const writeFileFn = new WriteFileFunction(context.client, context.scripts);
    const readFileFn = new ReadFileFunction(context.client, context.scripts);
    const readDirectoryFn = new ReadDirectoryFunction(context.client, context.scripts);
    const pythonTestAnalyserFn = new RunAndAnalysePythonTestFunction();
    const summarizeDirectoryFn = new SummarizeDirectoryFunction(context.llm, context.chat.tokenizer);
    const initPoetryFn = new InitPoetryFunction();

    const config: ScriptedAgentConfig = {
      functions: [
        onGoalAchievedFn,
        onGoalFailedFn,
        writeFileFn,
        readFileFn,
        readDirectoryFn,
        pythonTestAnalyserFn,
        summarizeDirectoryFn,
        initPoetryFn
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
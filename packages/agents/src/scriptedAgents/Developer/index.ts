import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { RunAndAnalysePythonTestFunction } from "../../functions/RunAndAnalysePythonTest";
import { SummarizeDirectoryFunction } from "../../functions/SummarizeDirectory";
import { InitPoetryFunction } from "../../functions/InitPoetry";
import { ScriptedAgentRunArgs } from "../ScriptedAgent";
import { AgentBaseContext } from "../../AgentBase";
import { AgentWithGoal } from "../../AgentWithGoal";
import { prompts } from "./prompts";

export class DeveloperAgent extends AgentWithGoal<ScriptedAgentRunArgs> {
  constructor(context: AgentBaseContext) {
    const writeFileFn = new WriteFileFunction(context.scripts);
    const readFileFn = new ReadFileFunction(context.scripts);
    const readDirectoryFn = new ReadDirectoryFunction(context.scripts);
    const pythonTestAnalyserFn = new RunAndAnalysePythonTestFunction();
    const summarizeDirectoryFn = new SummarizeDirectoryFunction(context.llm, context.chat.tokenizer);
    const initPoetryFn = new InitPoetryFunction();

    super(
      () => prompts(writeFileFn, readFileFn),
      [
        writeFileFn,
        readFileFn,
        readDirectoryFn,
        pythonTestAnalyserFn,
        summarizeDirectoryFn,
        initPoetryFn
      ], 
      context
    );
  }
}

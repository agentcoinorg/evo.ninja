import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { RunAndAnalysePythonTestFunction } from "../../functions/RunAndAnalysePythonTest";
import { AgentContext } from "../../AgentContext";
import { Agent } from "../../Agent";
import { AgentConfig } from "../../AgentConfig";
import { SummarizeDirectoryFunction } from "../../functions/SummarizeDirectory";
import { InitPoetryFunction } from "../../functions/InitPoetry";
import { prompts } from "./prompts";

export class DeveloperAgent extends Agent {
  constructor(context: AgentContext) {
    const writeFileFn = new WriteFileFunction(context.scripts);
    const readFileFn = new ReadFileFunction(context.scripts);
    const readDirectoryFn = new ReadDirectoryFunction(context.scripts);
    const pythonTestAnalyserFn = new RunAndAnalysePythonTestFunction();
    const summarizeDirectoryFn = new SummarizeDirectoryFunction(context.llm, context.chat.tokenizer);
    const initPoetryFn = new InitPoetryFunction();

    super(
      new AgentConfig(
        () => prompts(writeFileFn, readFileFn),
        [
          writeFileFn,
          readFileFn,
          new ReadDirectoryFunction(context.scripts),
          new RunAndAnalysePythonTestFunction(),
          readDirectoryFn,
          pythonTestAnalyserFn,
          summarizeDirectoryFn,
          initPoetryFn
        ], 
        context.scripts
      ),
      context
    );
  }
}

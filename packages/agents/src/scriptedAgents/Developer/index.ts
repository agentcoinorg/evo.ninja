// import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadFileFunction } from "../../functions/ReadFile";
// import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
// import { RunAndAnalysePythonTestFunction } from "../../functions/RunAndAnalysePythonTest";
// import { SummarizeDirectoryFunction } from "../../functions/SummarizeDirectory";
// import { InitPoetryFunction } from "../../functions/InitPoetry";
import { CodeFunction } from "../../functions/Code";
import { AnalyzeCode } from "../../functions/AnalyzeCode";
import { AgentContext } from "../../AgentContext";
import { Agent } from "../../Agent";
import { AgentConfig } from "../../AgentConfig";
import { prompts } from "./prompts";

export class DeveloperAgent extends Agent {
  constructor(context: AgentContext) {
    // const writeFileFn = new WriteFileFunction(context.scripts);
    const readFileFn = new ReadFileFunction(context.scripts);
    // const readDirectoryFn = new ReadDirectoryFunction(context.scripts);
    // const pythonTestAnalyserFn = new RunAndAnalysePythonTestFunction();
    // const summarizeDirectoryFn = new SummarizeDirectoryFunction(context.llm, context.chat.tokenizer);
    // const initPoetryFn = new InitPoetryFunction();

    super(
      new AgentConfig(
        () => prompts(),
        [
          new CodeFunction(context.llm, context.chat.tokenizer),
          new AnalyzeCode(context.llm, context.chat.tokenizer),
          // writeFileFn,
          readFileFn,
          // new ReadDirectoryFunction(context.scripts),
          // new RunAndAnalysePythonTestFunction(),
          // readDirectoryFn,
          // pythonTestAnalyserFn,
          // summarizeDirectoryFn,
          // initPoetryFn
        ],
        context.scripts
      ),
      context
    );
  }
}

import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { RunAndAnalysePythonTestFunction } from "../../functions/RunAndAnalysePythonTest";
import { AgentContext } from "@evo-ninja/agent-utils";
import { Agent } from "../../Agent";
import { AgentConfig } from "../../AgentConfig";
import { SummarizeDirectoryFunction } from "../../functions/SummarizeDirectory";
import { InitPoetryFunction } from "../../functions/InitPoetry";
import { prompts } from "./prompts";
import { CodeFunction } from "../../functions/Code";
import { RunPytest } from "../../functions/RunPytest";

export class DeveloperAgent extends Agent {
  constructor(context: AgentContext) {
    // const readFileFn = new ReadFileFunction(context.scripts);
    // const readDirectoryFn = new ReadDirectoryFunction(context.scripts);
    // const pythonTestAnalyserFn = new RunAndAnalysePythonTestFunction();
    // const summarizeDirectoryFn = new SummarizeDirectoryFunction(
    //   context.llm,
    //   context.chat.tokenizer
    // );
    // const initPoetryFn = new InitPoetryFunction();

    super(
      new AgentConfig(
        () => prompts(),
        [
          new CodeFunction(context.llm, context.chat.tokenizer),
          new ReadFileFunction(context.scripts),
          new RunPytest(),
          new InitPoetryFunction()
        ],
        context.scripts
      ),
      context
    );
  }
}

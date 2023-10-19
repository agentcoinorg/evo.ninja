import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { prompts } from "./prompts";
import { RunAndAnalysePythonTestFunction } from "../../functions/RunAndAnalysePythonTest";
import { AgentContext } from "../../AgentContext";
import { Agent } from "../../Agent";
import { AgentConfig } from "../../AgentConfig";

export class DeveloperAgent extends Agent {
  constructor(context: AgentContext) {
    const writeFileFn = new WriteFileFunction(context.scripts);
    const readFileFn = new ReadFileFunction(context.scripts);
    super(
      new AgentConfig(
        () => prompts(writeFileFn, readFileFn),
        [
          writeFileFn,
          readFileFn,
          new ReadDirectoryFunction(context.scripts),
          new RunAndAnalysePythonTestFunction(),
        ], 
        context.scripts
      ),
      context
    );
  }
}

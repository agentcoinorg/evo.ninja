import { prompts } from "./prompts";
import { Agent } from "../../Agent";
import { AgentConfig } from "../../AgentConfig";
import { AgentContext } from "../../AgentContext";
import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";

export class ResearcherAgent extends Agent {
  constructor(context: AgentContext) {
    super(
      new AgentConfig(
        () => prompts,
        [
          new WriteFileFunction(context.scripts),
          new ReadFileFunction(context.scripts),
          new ReadDirectoryFunction(context.scripts),
        ], 
        context.scripts,
      ),
      context
    );
  }
}

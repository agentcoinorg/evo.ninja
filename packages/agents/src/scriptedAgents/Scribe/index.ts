import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { ThinkFunction } from "../../functions/Think";
import { Agent } from "../../Agent";
import { AgentContext } from "@evo-ninja/agent-utils";
import { AgentConfig } from "../../AgentConfig";
import { prompts } from "./prompts";

export class ScribeAgent extends Agent {
  constructor(context: AgentContext) {

    super(
      new AgentConfig(
        () => prompts,
        [
          new WriteFileFunction(context.scripts),
          new ReadFileFunction(context.scripts),
          new ReadDirectoryFunction(context.scripts),
          new ThinkFunction()
        ],
        context.scripts
      ),
      context
    );
  }
}

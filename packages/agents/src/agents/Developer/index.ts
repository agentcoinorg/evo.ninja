import { ReadFileFunction } from "../../functions/ReadFile";
import { AgentContext } from "@evo-ninja/agent-utils";
import { InitPoetryFunction } from "../../functions/InitPoetry";
import { prompts } from "./prompts";
import { RunPytest } from "../../functions/RunPytest";
import { WriteFileFunction } from "../../functions/WriteFile";
import { Agent, AgentConfig } from "../utils";

export class DeveloperAgent extends Agent {
  constructor(context: AgentContext) {
    super(
      new AgentConfig(
        () => prompts(),
        [
          new WriteFileFunction(context.scripts),
          new ReadFileFunction(context.scripts),
          new RunPytest(),
          new InitPoetryFunction(),
        ],
        context.scripts
      ),
      context
    );
  }
}

/*public override async onFirstRun(args: GoalRunArgs, chat: Chat): Promise<void> {
  await Promise.all([
    this.executeFunction(new InitPoetryFunction(), {}, chat),
    this.executeFunction(new PlanDevelopmentFunction(), args, chat)
  ]);
  return Promise.resolve();
}*/

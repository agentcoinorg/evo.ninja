import { ReadFileFunction } from "../../functions/ReadFile";
import { AgentContext, Chat } from "@evo-ninja/agent-utils";
import { Agent, GoalRunArgs } from "../../Agent";
import { AgentConfig } from "../../AgentConfig";
import { InitPoetryFunction } from "../../functions/InitPoetry";
import { PlanDevelopmentFunction } from "../../functions/PlanDevelopment";
import { prompts } from "./prompts";
import { RunPytest } from "../../functions/RunPytest";
import { WriteFileFunction } from "../../functions/WriteFile";

export class DeveloperAgent extends Agent {
  constructor(context: AgentContext) {
    super(
      new AgentConfig(
        () => prompts(),
        [
          new WriteFileFunction(context.scripts),
          new ReadFileFunction(context.scripts),
          new RunPytest(),
        ],
        context.scripts
      ),
      context
    );
  }

  public override async onFirstRun(args: GoalRunArgs, chat: Chat): Promise<void> {
    await Promise.all([
      this.executeFunction(new InitPoetryFunction(), {}, chat),
      this.executeFunction(new PlanDevelopmentFunction(), args, chat)
    ]);
  }
}

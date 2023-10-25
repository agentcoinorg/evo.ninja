import { ReadFileFunction } from "../../functions/ReadFile";
import { CodeFunction } from "../../functions/Code";
import { DevelopmentPlanner } from "../../functions/DevelopmentPlan";
import { AgentContext } from "../../AgentContext";
import { Agent } from "../../Agent";
import { AgentConfig } from "../../AgentConfig";
import { prompts } from "./prompts";
import { RunPytest } from "../../functions/RunPytest";

export class DeveloperAgent extends Agent {
  constructor(context: AgentContext) {
    super(
      new AgentConfig(
        () => prompts(),
        [
          new DevelopmentPlanner(context.llm, context.chat.tokenizer),
          new CodeFunction(context.llm, context.chat.tokenizer),
          new ReadFileFunction(context.scripts),
          new RunPytest(),
        ],
        context.scripts
      ),
      context
    );
  }
}

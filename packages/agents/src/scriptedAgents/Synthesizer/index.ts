import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadFileFunction } from "../../functions/ReadFile";
import { Agent } from "../../Agent";
import { AgentContext } from "../../AgentContext";
import { AgentConfig } from "../../AgentConfig";
import { prompts } from "./prompts";

export class SynthsizerAgent extends Agent {
  constructor(context: AgentContext) {

    super(
      new AgentConfig(
        () => prompts,
        [
          new WriteFileFunction(context.scripts),
          new ReadFileFunction(context.scripts),
        ],
        context.scripts
      ),
      context
    );
  }
}

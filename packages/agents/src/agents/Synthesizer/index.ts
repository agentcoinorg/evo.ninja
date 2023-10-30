import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadFileFunction } from "../../functions/ReadFile";
import { AgentContext } from "@evo-ninja/agent-utils";
import { prompts } from "./prompts";
import { Agent, AgentConfig } from "../utils";

export class SynthesizerAgent extends Agent {
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

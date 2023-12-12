import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadFileFunction } from "../../functions/ReadFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { AgentContext } from "@/agent-core";
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
          new ReadDirectoryFunction(context.scripts),
        ],
        context.scripts
      ),
      context
    );
  }
}

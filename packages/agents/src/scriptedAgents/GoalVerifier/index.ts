import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { ReadFileFunction } from "../../functions/ReadFile";
import { AgentContext } from "@evo-ninja/agent-utils";
import { prompts } from "./prompts";
import { ChatMessage } from "@evo-ninja/agent-utils";
import { Agent, AgentConfig } from "../../agents/utils";

export interface GoalVerifierRunArgs {
  messagesToVerify: ChatMessage[]
}

export class GoalVerifierAgent extends Agent<GoalVerifierRunArgs> {
  constructor(context: AgentContext) {
    super(
      new AgentConfig(
        prompts,
        [
          new ReadFileFunction(context.scripts),
          new ReadDirectoryFunction(context.scripts),
        ], 
        context.scripts, 
      ),
      context
    );
  }
}

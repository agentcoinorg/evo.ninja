import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { ReadFileFunction } from "../../functions/ReadFile";
import { AgentContext } from "@/agent-core";
import { prompts } from "./prompts";
import { ChatMessage } from "@/agent-core";
import { Agent, AgentConfig } from "../utils";

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

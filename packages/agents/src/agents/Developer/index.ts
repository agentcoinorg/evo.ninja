import { ReadFileFunction } from "../../functions/ReadFile";
import { AgentContext } from "@/agent-core";
import { InitPoetryFunction } from "../../functions/InitPoetry";
import { RunPytest } from "../../functions/RunPytest";
import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadDirectoryFunction } from "../../functions";
import { prompts } from "./prompts";
import { Agent, AgentConfig } from "../utils";

export class DeveloperAgent extends Agent {
  constructor(context: AgentContext) {
    super(
      new AgentConfig(
        () => prompts(),
        [
          new WriteFileFunction(context.scripts),
          new ReadFileFunction(context.scripts),
          new ReadDirectoryFunction(context.scripts),
          /*new RunPytest(),
          new InitPoetryFunction(),*/
        ],
        context.scripts
      ),
      context
    );
  }
}

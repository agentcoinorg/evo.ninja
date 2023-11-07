import { AgentContext } from "@/agent-core";
import { CreateScriptFunction } from "../../functions/CreateScript";
import { ExecuteScriptFunction } from "../../functions/ExecuteScript";
import { FindScriptFunction } from "../../functions/FindScript";
import { ReadVariableFunction } from "../../functions/ReadVariable";
import { ReadFileFunction } from "../../functions/ReadFile";
import { WriteFileFunction } from "../../functions/WriteFile";
import { ReadDirectoryFunction } from "../../functions/ReadDirectory";
import { prompts } from "./prompts";
import { Agent, AgentConfig } from "../utils";

export class ScripterAgent extends Agent {
  constructor(context: AgentContext) {
    super(
      new AgentConfig(
        () => prompts,
        [
          new CreateScriptFunction(context.llm, context.chat.tokenizer),
          new ExecuteScriptFunction(),
          new FindScriptFunction(context.scripts),
          new ReadVariableFunction(),
          new ReadFileFunction(context.scripts),
          new WriteFileFunction(context.scripts),
          new ReadDirectoryFunction(context.scripts),
        ], 
        context.scripts,
      ),
      context
    );
  }
}

import { AgentContext } from "@evo-ninja/agent-utils";
import { WriteScriptFunction } from "../../functions/WriteScript";
import { ThinkFunction } from "../../functions/Think";
import { prompts } from "./prompts";
import { ReadVariableFunction } from "../../functions/ReadVariable";
import { Agent, AgentConfig } from "../utils";

export interface ScriptWriterRunArgs {
  namespace: string;
  description: string;
  args: string;
}

export class ScriptWriter extends Agent<ScriptWriterRunArgs> {
  constructor(context: AgentContext) {
    const writeScriptFn = new WriteScriptFunction();

    super(
      new AgentConfig(
        () => prompts,
        [
          new ReadVariableFunction(),
          new ThinkFunction(), 
          writeScriptFn
        ], 
        context.scripts,
        undefined,
        (functionCalled) => functionCalled.name === writeScriptFn.name,
        true
      ),
      context
    );
  }
}

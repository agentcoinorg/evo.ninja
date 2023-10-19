import { AgentContext } from "../../AgentContext";
import { WriteScriptFunction } from "../../functions/WriteScript";
import { ThinkFunction } from "../../functions/Think";
import { prompts } from "./prompts";
import { AgentConfig } from "../../AgentConfig";
import { Agent } from "../../Agent";

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
          new ThinkFunction(), 
          writeScriptFn
        ], 
        context.scripts,
        undefined,
        (functionCalled) => functionCalled.name === writeScriptFn.name
      ),
      context
    );
  }
}

import { AgentContext } from "@/agent-core";
import { WriteScriptFunction } from "../../functions/WriteScript";
import { prompts } from "./prompts";
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

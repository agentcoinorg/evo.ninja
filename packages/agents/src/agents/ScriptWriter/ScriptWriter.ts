import { AgentBase, AgentBaseConfig, AgentBaseContext } from "../../AgentBase";
import { WriteScriptFunction } from "../../functions/WriteScript";
import { ThinkFunction } from "../../functions/Think";
import { prompts } from "./prompts";

export interface ScriptWriterRunArgs {
  namespace: string;
  description: string;
  args: string;
}

export class ScriptWriter extends AgentBase<
  ScriptWriterRunArgs,
  AgentBaseContext
> {
  constructor(context: AgentBaseContext) {
    const writeScriptFn = new WriteScriptFunction();

    const config: AgentBaseConfig<ScriptWriterRunArgs> = {
      functions: [
        new ThinkFunction(), 
        writeScriptFn
      ],
      shouldTerminate: (functionCalled) =>
        functionCalled.name === writeScriptFn.name,
      prompts,
    };

    super(config, context);
  }
}

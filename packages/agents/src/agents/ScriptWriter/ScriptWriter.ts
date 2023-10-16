import {
  LlmApi,
  Chat,
  Workspace,
  Env,
  Logger,
  AgentVariables,
} from "@evo-ninja/agent-utils";
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
  constructor(
    llm: LlmApi,
    chat: Chat,
    workspace: Workspace,
    logger: Logger,
    env: Env
  ) {
    const agentContext: AgentBaseContext = {
      llm: llm,
      chat: chat,
      logger,
      workspace: workspace,
      variables: new AgentVariables(),
      env,
    };

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

    super(config, agentContext);
  }
}

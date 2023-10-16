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
import * as prompts from "./prompts";

const AGENT_NAME = "ScriptWriter";

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
      name: AGENT_NAME,
      expertise: prompts.EXPERTISE,
      initialMessages: prompts.INITIAL_MESSAGES,
      loopPreventionPrompt: prompts.LOOP_PREVENTION_PROMPT,
      functions: [new ThinkFunction(), writeScriptFn],
      shouldTerminate: (functionCalled) =>
        functionCalled.name === writeScriptFn.name,
    };

    super(config, agentContext);
  }
}

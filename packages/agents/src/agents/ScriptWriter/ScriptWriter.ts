import { LlmApi, Chat, Workspace, Env, agentPlugin, WrapClient, Logger } from "@evo-ninja/agent-utils";
import { AgentBase } from "../../AgentBase";
import { SCRIPTWRITER_AGENT_CONFIG, ScriptWriterContext, ScriptWriterRunArgs } from "./config";

export class ScriptWriter extends AgentBase<ScriptWriterRunArgs, ScriptWriterContext> {
  constructor(
    llm: LlmApi,
    chat: Chat,
    workspace: Workspace,
    logger: Logger,
    env: Env
  ) {

    const agentContext = {
      llm: llm,
      chat: chat,
      logger,
      workspace: workspace,
      client: new WrapClient(
        workspace,
        logger,
        agentPlugin({ logger: logger }),
        env
      ),
      env
    };
      
    super(SCRIPTWRITER_AGENT_CONFIG, agentContext);
  }
}
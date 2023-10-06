import { LlmApi, Chat, Workspace, Scripts, Env, agentPlugin, WrapClient, Logger } from "@evo-ninja/agent-utils";
import { AgentBase } from "../../AgentBase";
import { SCRIPTER_AGENT_CONFIG, ScripterContext, ScripterRunArgs } from "./config";

export class Scripter extends AgentBase<ScripterRunArgs, ScripterContext> {
  constructor(
    llm: LlmApi,
    chat: Chat,
    logger: Logger,
    workspace: Workspace,
    scripts: Scripts,
    env: Env
  ) {
    const agentContext = {
      llm,
      chat,
      workspace,
      scripts,
      logger,
      globals: {},
      client: new WrapClient(
        workspace,
        logger,
        agentPlugin({ logger }),
        env
      ),
      env
    };

    super(SCRIPTER_AGENT_CONFIG, agentContext);
  }
}

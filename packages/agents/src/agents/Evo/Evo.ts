import { LlmApi, Chat, Workspace, Scripts, Env, WrapClient, agentPlugin, Logger, Timeout } from "@evo-ninja/agent-utils";
import { EVO_AGENT_CONFIG, EvoContext, EvoRunArgs } from "./config";
import { AgentBase } from "../../AgentBase";

export class Evo extends AgentBase<EvoRunArgs, EvoContext> {
  constructor(
    llm: LlmApi,
    chat: Chat,
    logger: Logger,
    workspace: Workspace,
    scripts: Scripts,
    env: Env,
    timeout?: Timeout
  ) {
    const context = {
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

    super({
      ...EVO_AGENT_CONFIG,
      timeout
    }, context);
  }
}
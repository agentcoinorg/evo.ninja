import { LlmApi, Chat, Workspace, Scripts, Env, WrapClient, agentPlugin, Logger, Timeout } from "@evo-ninja/agent-utils";
import { EVO_AGENT_CONFIG, EvoContext, EvoRunArgs } from "./config";
import { AgentBase } from "../../AgentBase";
import {
  ScriptedAgentConfig,
  DEVELOPER_AGENT_CONFIG,
  RESEARCHER_AGENT_CONFIG,
} from "../../scriptedAgents";

export const defaultScriptedAgents = [
  DEVELOPER_AGENT_CONFIG,
  RESEARCHER_AGENT_CONFIG
];

export class Evo extends AgentBase<EvoRunArgs, EvoContext> {
  constructor(
    llm: LlmApi,
    chat: Chat,
    logger: Logger,
    workspace: Workspace,
    scripts: Scripts,
    env: Env,
    timeout?: Timeout,
    scriptedAgents?: ScriptedAgentConfig[],
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
      ...EVO_AGENT_CONFIG(scriptedAgents || defaultScriptedAgents),
      timeout
    }, context);
  }
}

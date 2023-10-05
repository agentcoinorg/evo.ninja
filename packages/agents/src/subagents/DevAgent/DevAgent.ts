import {
  Chat,
  Env,
  LlmApi,
  Logger,
  Scripts,
  Workspace,
  WrapClient,
  agentPlugin,
} from "@evo-ninja/agent-utils";
import { SubAgent } from "../SubAgent";
import { DEV_AGENT_CONFIG } from "./config";

export class DevAgent extends SubAgent {
  constructor(
    llm: LlmApi,
    chat: Chat,
    workspace: Workspace,
    scripts: Scripts,
    logger: Logger,
    env: Env
    ) {
    const agentContext = {
      llm: llm,
      chat: chat,
      scripts: scripts,
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

    super(DEV_AGENT_CONFIG, agentContext);
  }
}
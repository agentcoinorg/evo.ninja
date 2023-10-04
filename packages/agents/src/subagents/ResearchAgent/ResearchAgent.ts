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
import { RESEARCH_AGENT_CONFIG } from "./config";

export class ResearchAgent extends SubAgent {
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
      workspace: workspace,
      logger,
      client: new WrapClient(
        workspace,
        logger,
        agentPlugin({ logger: logger }),
        env
      ),
      env
    };

    super(RESEARCH_AGENT_CONFIG, agentContext);
  }
}
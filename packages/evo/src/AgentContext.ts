import { Workspace, LlmApi, Scripts, Chat, Logger } from "@evo-ninja/agent-utils";
import { WrapClient } from "./wrap";

export interface AgentContext {
  globals: Record<string, string>;
  client: WrapClient;
  workspace: Workspace;
  scripts: Scripts;
  llm: LlmApi;
  chat: Chat;
  logger: Logger;
}

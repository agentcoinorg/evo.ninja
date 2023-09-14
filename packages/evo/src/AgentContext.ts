import { Workspace, LlmApi, Chat, Logger } from "@evo-ninja/agent-utils";
import { Scripts } from "./Scripts";
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

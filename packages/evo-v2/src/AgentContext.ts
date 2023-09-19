import { Workspace, LlmApi, Chat, Logger, AgentFunction } from "@evo-ninja/agent-utils";
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
  functions: AgentFunction<AgentContext>[];
}

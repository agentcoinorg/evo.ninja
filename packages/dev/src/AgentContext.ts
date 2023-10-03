import {
  Chat,
  LlmApi,
  Scripts,
  WrapClient,
  Workspace
} from "@evo-ninja/agent-utils";

export interface AgentContext {
  llm: LlmApi;
  chat: Chat;
  workspace: Workspace;
  scripts: Scripts;
  client: WrapClient;
}

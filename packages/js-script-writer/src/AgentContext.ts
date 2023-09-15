import { Workspace, LlmApi, Chat } from "@evo-ninja/agent-utils";

export interface AgentContext {
  workspace: Workspace;
  llm: LlmApi;
  chat: Chat;
}

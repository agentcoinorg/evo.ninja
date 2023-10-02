import {
  Chat,
  LlmApi,
  Scripts
} from "@evo-ninja/agent-utils";

export interface AgentContext {
  llm: LlmApi;
  chat: Chat;
  scripts: Scripts;
}

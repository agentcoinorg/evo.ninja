import { Logger, Workspace, Env, Scripts, WrapClient, agentPlugin } from "@evo-ninja/agent-utils";
import { LlmApi, Chat } from "../llm";
import { AgentVariables } from "./AgentVariables";
import { EmbeddingApi } from "..";

export class AgentContext {
  constructor(
    public llm: LlmApi,
    public embedding: EmbeddingApi,
    public chat: Chat,
    public readonly logger: Logger,
    public readonly workspace: Workspace,
    public readonly internals: Workspace,
    public readonly env: Env,
    public readonly scripts: Scripts,
    public readonly client: WrapClient = new WrapClient(workspace, logger, agentPlugin({ logger }), env),
    public readonly variables: AgentVariables = new AgentVariables()
  ) { }

  cloneEmpty(): AgentContext {
    return new AgentContext(
      this.llm,
      this.embedding,
      this.chat.cloneEmpty(),
      this.logger,
      this.workspace,
      this.internals,
      this.env,
      this.scripts,
      this.client,
      this.variables
    );
  }
}

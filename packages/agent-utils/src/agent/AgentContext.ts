import { LlmApi, Chat } from "../llm";
import { Scripts, WrapClient, agentPlugin } from "../scripts";
import { Logger, Workspace, Env } from "../sys";
import { AgentVariables } from "./AgentVariables";

export class AgentContext {
  constructor(
    public readonly llm: LlmApi,
    public chat: Chat,
    public readonly logger: Logger,
    public readonly workspace: Workspace,
    public readonly internals: Workspace,
    public readonly env: Env,
    public readonly scripts: Scripts,
    public readonly client: WrapClient = new WrapClient(
      workspace,
      logger,
      agentPlugin({ logger }),
      env
    ),
    public readonly variables: AgentVariables = new AgentVariables()
  ) {}

  cloneEmpty(): AgentContext {
    return new AgentContext(
      this.llm,
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

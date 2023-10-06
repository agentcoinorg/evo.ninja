import { Agent, AgentFunctionResult, AgentFunctionDefinition } from "@evo-ninja/agent-utils"

export abstract class AgentFunctionBase<TContext, TParams> {
  abstract get name(): string;
  abstract get description(): string;
  abstract get parameters(): any;

  abstract buildExecutor(agent: Agent<unknown>, context: TContext): (params: TParams) => Promise<AgentFunctionResult>;

  getDefinition(): AgentFunctionDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: this.parameters
    };
  }
}

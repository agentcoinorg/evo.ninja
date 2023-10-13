import { Agent, AgentFunctionResult, AgentFunctionDefinition } from "@evo-ninja/agent-utils"
import { AgentBaseContext } from "./AgentBase";

export abstract class AgentFunctionBase<TParams> {
  abstract get name(): string;
  abstract get description(): string;
  abstract get parameters(): any;

  abstract buildExecutor(agent: Agent<unknown>, context: AgentBaseContext): (params: TParams, rawParams?: string) => Promise<AgentFunctionResult>;

  getDefinition(): AgentFunctionDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: this.parameters
    };
  }
}

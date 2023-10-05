import { Agent, AgentFunctionResult } from "@evo-ninja/agent-utils"
import { Result } from "@polywrap/result";

export abstract class AgentFunctionBase<TContext, TParams> {
  abstract get name(): string;
  abstract get description(): string;
  abstract get parameters(): any;

  abstract buildExecutor(agent: Agent<unknown>, context: TContext): (params: TParams) => Promise<Result<AgentFunctionResult, string>>;
}


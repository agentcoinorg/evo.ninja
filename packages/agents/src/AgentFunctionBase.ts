import { Agent, AgentFunctionResult, AgentOutputType } from "@evo-ninja/agent-utils"
import { ChatCompletionRequestMessage } from "openai";
import { Result } from "@polywrap/result";

export interface HandlerResult {
  outputs: {
    type: AgentOutputType;
    title: string;
    content?: string;
  }[];
  messages: ChatCompletionRequestMessage[];
}

export abstract class AgentFunctionBase<TContext, TParams> {
  abstract get name(): string;
  abstract get description(): string;
  abstract get parameters(): any;
  
  abstract buildExecutor(agent: Agent<unknown>, context: TContext): (params: TParams) => Promise<Result<AgentFunctionResult, string>>;
}


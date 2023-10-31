import { AgentOutput } from "./AgentOutput";
import { ChatMessage, FunctionDefinition } from "../llm";

export type AgentFunctionResult = {
  outputs: AgentOutput[];
  messages: ChatMessage[];
  storeInVariable?: boolean;
};

export interface AgentFunction<TContext> {
  definition: FunctionDefinition;
  buildExecutor<TParams>(
    context: TContext
  ): (params: TParams, rawParams?: string) => Promise<AgentFunctionResult>;
}

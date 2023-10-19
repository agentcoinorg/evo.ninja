import { AgentOutput } from "./AgentOutput";
import { ChatMessage, FunctionDefinition } from "../llm";

export type AgentFunctionResult = {
  outputs: AgentOutput[];
  messages: ChatMessage[];
};

export interface AgentFunction<TContext> {
  definition: FunctionDefinition;
  buildExecutor(
    context: TContext
  ): (params: any, rawParams?: string) => Promise<AgentFunctionResult>;
}

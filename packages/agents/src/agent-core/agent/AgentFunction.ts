import { AgentOutput } from "./AgentOutput";
import { ChatMessage, FunctionDefinition } from "../llm";

export type AgentFunctionResult = {
  outputs: AgentOutput[];
  messages: ChatMessage[];
  storeInVariable?: boolean;
};

export interface AgentFunction<TContext> {
  definition: FunctionDefinition;
  buildExecutor(
    context: TContext
  ): (toolId: string, params: any, rawParams?: string) => Promise<AgentFunctionResult>;
}

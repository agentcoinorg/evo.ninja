import { AgentOutput } from "./AgentOutput";
import { ChatMessage } from "../llm";

import { ChatCompletionFunctions } from "openai";

export type AgentFunctionDefinition = ChatCompletionFunctions;

export type AgentFunctionResult = {
  outputs: AgentOutput[];
  messages: ChatMessage[];
};

export interface AgentFunction<TContext> {
  definition: AgentFunctionDefinition;
  buildExecutor(
    context: TContext
  ): (params: any, rawParams?: string) => Promise<AgentFunctionResult>;
}

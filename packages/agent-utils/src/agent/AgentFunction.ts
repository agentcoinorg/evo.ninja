import { AgentOutput } from "./AgentOutput";
import { ChatMessage } from "../llm";

import { Result } from "@polywrap/result";
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
  ): (options: any) => Promise<Result<AgentFunctionResult, string>>;
}

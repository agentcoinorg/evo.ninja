import { Result } from "@polywrap/result";
import { AgentOutput } from "./AgentOutput";
import { LlmOptions } from "../llm";

export interface Agent<TRunArgs> {
  run(args: TRunArgs, llmOptions?: LlmOptions): AsyncGenerator<AgentOutput, RunResult, string | undefined>;
}

export type RunResult = Result<AgentOutput, string>; 

export enum PromptType {
  None,
  Prompt,
  Question,
}

import { Result } from "@polywrap/result";
import { AgentOutput } from "./AgentOutput";

export interface RunnableAgent<TRunArgs> {
  run(args: TRunArgs): AsyncGenerator<AgentOutput, RunResult, string | undefined>;
}

export type RunResult = Result<AgentOutput, string>; 

export enum PromptType {
  None,
  Prompt,
  Question,
}

import { Result } from "@polywrap/result";
import { AgentOutput } from "./AgentOutput";

export interface Agent {
  run(
    namespace: string, 
    description: string,
    args: string,
  ): AsyncGenerator<AgentOutput, RunResult, string | undefined>;
}

export type RunResult = Result<AgentOutput, string>; 

export enum PromptType {
  None,
  Prompt,
  Question,
}

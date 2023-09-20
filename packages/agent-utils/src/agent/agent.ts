import { Result } from "@polywrap/result";
import { AgentOutputMessage } from "./agent-function";

export interface Agent {
  run(
    namespace: string, 
    description: string,
    args: string,
  ): AsyncGenerator<StepOutput, RunResult, string | undefined>;
}

export type RunResult = Result<StepOutput, string>; 

export enum PromptType {
  None,
  Prompt,
  Question,
}

export class StepOutput {
  message: AgentOutputMessage;
  promptType: PromptType;

  constructor(message: AgentOutputMessage, promptType?: PromptType) {
    this.message = message;
    this.promptType = promptType ?? PromptType.None;
  }

  static message(msg: AgentOutputMessage): StepOutput {
    return new StepOutput(msg);
  }

  static prompt(msg: AgentOutputMessage): StepOutput {
    return new StepOutput(msg, PromptType.Prompt);
  }

  static question(msg: AgentOutputMessage): StepOutput {
    return new StepOutput(msg, PromptType.Question);
  }
}

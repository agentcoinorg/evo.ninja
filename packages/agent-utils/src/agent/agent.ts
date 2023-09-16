import { Result } from "@polywrap/result";
import { AgentChatMessage } from "./agent-function";

export interface Agent {
  run(
    namespace: string, 
    description: string,
    args: string,
  ): AsyncGenerator<StepOutput, RunResult, string | undefined>;
}

export type RunResult = Result<undefined, string>; 

export enum PromptType {
  None,
  Prompt,
  Question,
}

export class StepOutput {
  message: AgentChatMessage;
  promptType: PromptType;

  constructor(message: AgentChatMessage, promptType?: PromptType) {
    this.message = message;
    this.promptType = promptType ?? PromptType.None;
  }

  static message(msg: AgentChatMessage): StepOutput {
    return new StepOutput(msg);
  }

  static prompt(msg: AgentChatMessage): StepOutput {
    return new StepOutput(msg, PromptType.Prompt);
  }

  static question(msg: AgentChatMessage): StepOutput {
    return new StepOutput(msg, PromptType.Question);
  }
}

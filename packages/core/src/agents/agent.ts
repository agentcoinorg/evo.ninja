export abstract class Agent {
  abstract run(
    namespace: string, 
    description: string,
    args: string,
  ): AsyncGenerator<StepOutput, RunResult, string | undefined>;
}

export class RunResult {
  message?: string;
  isError?: boolean;

  constructor(message?: string, isError?: boolean) {
    this.message = message;
    this.isError = isError;
  }

  static ok(msg?: string): RunResult {
    return new RunResult(msg);
  }

  static error(msg?: string): RunResult {
    return new RunResult(msg, true);
  }
}

export enum PromptType {
  None,
  Prompt,
  Question,
}

export class StepOutput {
  message: string;
  promptType: PromptType;

  constructor(message: string, promptType?: PromptType) {
      this.message = message;
      this.promptType = promptType ?? PromptType.None;
  }

  static message(msg?: string): StepOutput {
      return new StepOutput(msg ?? "");
  }

  static prompt(msg: string): StepOutput {
      return new StepOutput(msg, PromptType.Prompt);
  }

  static question(msg: string): StepOutput {
      return new StepOutput(msg, PromptType.Question);
  }
}

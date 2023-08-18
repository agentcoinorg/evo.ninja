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
}

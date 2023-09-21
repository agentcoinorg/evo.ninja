import { Timer } from "./Timer";

import { Workspace } from "@evo-ninja/agent-utils";

interface DebugStep {
  time: Timer;
  message?: string;
  error?: string;
}

export class DebugLog {
  private _goal: string = "";
  private _goalTime: Timer = new Timer();
  private _steps: DebugStep[] = [];

  constructor(
    public workspace: Workspace
  ) { }

  private get _latestStep() {
    return this._steps[this._steps.length - 1];
  }

  save(): void {
    this.workspace.writeFileSync(
      "debug.json",
      this.toString()
    );
  }

  goalStart(goal: string): void {
    this._goal = goal;
    this._goalTime.start();
  }

  goalEnd(): void {
    this._goalTime.end();
  }

  stepStart(): void {
    const step: DebugStep = {
      time: new Timer()
    };
    step.time.start();
    this._steps.push(step);
  }

  stepEnd(): void {
    this._latestStep.time.end();
  }

  stepLog(message: string): void {
    this._latestStep.message = message;
  }

  stepError(error: string): void {
    this._latestStep.error = error;
  }

  toString(): string {
    return JSON.stringify(this.toJSON(), null, 2);
  }

  toJSON() {
    return {
      goal: {
        prompt: this._goal,
        time: this._goalTime.getHHMMSS()
      },
      steps: this._steps,
    };
  }
}

import { Timer } from "./Timer";

import { Workspace } from "@evo-ninja/agent-utils";

interface DebugStep {
  timer: Timer;
  message?: string;
  error?: string;
}

export class DebugLog {
  private _goal: string = "";
  private _goalTimer: Timer = new Timer();
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
    this._goalTimer.start();
  }

  goalEnd(): void {
    this._goalTimer.end();
  }

  stepStart(): void {
    const step: DebugStep = {
      timer: new Timer()
    };
    step.timer.start();
    this._steps.push(step);
  }

  stepEnd(): void {
    this._latestStep.timer.end();
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
        time: this._goalTimer.getHHMMSS()
      },
      steps: this._steps,
    };
  }
}

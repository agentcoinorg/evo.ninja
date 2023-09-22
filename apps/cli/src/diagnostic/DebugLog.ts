import { Timer } from "./Timer";
import { DebugLlmReq } from "./DebugLlmReq";

import { ChatMessageLog, LlmResponse, Workspace } from "@evo-ninja/agent-utils";

interface DebugGoal {
  prompt: string;
  time: Timer;
  tokens: number;
  llmReqs: number;
}

interface DebugStep {
  time: Timer;
  message?: string;
  error?: string;
  llmReqs: DebugLlmReq[];
}

export class DebugLog {
  private goal: DebugGoal = {
    prompt: "",
    time: new Timer(),
    tokens: 0,
    llmReqs: 0
  };
  private steps: DebugStep[] = [];

  constructor(
    public workspace: Workspace
  ) { }

  private get _latestStep() {
    return this.steps[this.steps.length - 1];
  }

  save(): void {
    this.workspace.writeFileSync(
      "debug.json",
      this.toString()
    );
  }

  goalStart(prompt: string): void {
    this.goal.prompt = prompt;
    this.goal.time.start();
    this.save();
  }

  goalEnd(): void {
    this.goal.time.end();
    this.save();
  }

  stepStart(): void {
    const step: DebugStep = {
      time: new Timer(),
      llmReqs: []
    };
    step.time.start();
    this.steps.push(step);
    this.save();
  }

  stepEnd(): void {
    this._latestStep.time.end();
    this.save();
  }

  stepLog(message: string): void {
    this._latestStep.message = message;
    this.save();
  }

  stepError(error: string): void {
    this._latestStep.error = error;
    this.save();
  }

  stepLlmReq(time: Timer, chat: ChatMessageLog, response?: LlmResponse): void {
    const req = new DebugLlmReq(time, chat, response);
    this.goal.llmReqs += 1;
    this.goal.tokens += req.tokens;
    this._latestStep.llmReqs.push(req);
    this.save();
  }

  toString(): string {
    return JSON.stringify(this.toJSON(), null, 2);
  }

  toJSON() {
    return {
      goal: this.goal,
      steps: this.steps,
    };
  }
}

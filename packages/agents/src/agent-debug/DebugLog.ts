import { Timer } from "./Timer";
import { DebugLlmReq } from "./DebugLlmReq";
import { Workspace } from "@evo-ninja/agent-utils";
import { PriorityContainer, ChatMessage, ChatLogs } from "@/agent-core";

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
  llmTime: Timer;
  llmReqs: DebugLlmReq[];
}

export class DebugLog {
  private goal: DebugGoal = {
    prompt: "",
    time: new Timer(),
    tokens: 0,
    llmReqs: 0,
  };
  private steps: DebugStep[] = [];
  private longestLlmReqs: PriorityContainer<DebugLlmReq>;

  constructor(public workspace: Workspace) {
    this.longestLlmReqs = new PriorityContainer<DebugLlmReq>(
      5,
      (a, b) => b.time.duration() - a.time.duration()
    );
  }

  private get latestStep() {
    return this.steps[this.steps.length - 1];
  }

  async save(): Promise<void> {
    await this.workspace.writeFile("debug.json", this.toString());
    await this.workspace.writeFile(
      "perf.json",
      JSON.stringify(this.longestLlmReqs.getItems(), null, 2)
    );
  }

  async goalStart(prompt: string): Promise<void> {
    this.goal.prompt = prompt;
    this.goal.time.start();
    await this.save();
  }

  async goalEnd(): Promise<void> {
    this.goal.time.end();
    await this.save();
  }

  async stepStart(): Promise<void> {
    const step: DebugStep = {
      time: new Timer(),
      llmTime: new Timer(),
      llmReqs: [],
    };
    step.time.start();
    this.steps.push(step);
    await this.save();
  }

  async stepEnd(): Promise<void> {
    this.latestStep.time.end();
    await this.save();
  }

  async stepLog(message: string): Promise<void> {
    this.latestStep.message = message;
    await this.save();
  }

  async stepError(error: string): Promise<void> {
    this.latestStep.error = error;
    await this.save();
  }

  async stepLlmReq(
    time: Timer,
    chatLogs: ChatLogs,
    response?: ChatMessage
  ): Promise<void> {
    const req = new DebugLlmReq(time, chatLogs, response);
    this.goal.llmReqs += 1;
    this.goal.tokens += req.tokens;
    this.latestStep.llmReqs.push(req);
    this.latestStep.llmTime.add(req.time.duration());
    this.longestLlmReqs.addItem(req);
    await this.save();
  }

  toString(): string {
    return JSON.stringify(this.toJSON(), null, 2);
  }

  toJSON(): {
    goal: DebugGoal;
    steps: DebugStep[];
  } {
    return {
      goal: this.goal,
      steps: this.steps,
    };
  }
}

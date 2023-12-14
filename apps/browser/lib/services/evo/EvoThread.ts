import { createEvoInstance } from "@/lib/services/evo/createEvoInstance";
import { GoalApi } from "@/lib/api";
import { ChatLog } from "@/components/Chat";
import {
  Evo,
  ChatLogType,
  ChatMessage,
  Workspace
} from "@evo-ninja/agents";

export interface EvoThreadConfig {
  chatId: string;
  loadChatLog: (chatId: string) => Promise<ChatLog[]>;
  onChatLogAdded: (chatLog: ChatLog) => Promise<void>;
  onMessagesAdded: (type: ChatLogType, messages: ChatMessage[]) => Promise<void>;
  onVariableSet: (key: string, value: string) => Promise<void>;
}

export interface EvoThreadState {
  isRunning: boolean;
  isLoading: boolean;
  logs: ChatLog[];
}

export interface EvoThreadCallbacks {
  setIsRunning: (value: boolean) => void;
  setChatLog: (chatLog: ChatLog[]) => void;
  onGoalCapReached: () => void;
  onError: (error: string) => void;
}

export interface EvoThreadStartOptions {
  goal: string;
  workspace: Workspace;
  allowTelemetry: boolean;
  openAiApiKey?: string;
}

const INIT_STATE: EvoThreadState = {
  isRunning: false,
  isLoading: false,
  logs: [],
};

export class EvoThread {
  private _state: EvoThreadState;
  private _callbacks?: EvoThreadCallbacks;

  constructor(
    private _config: EvoThreadConfig
  ) {
    this._state = Object.assign({}, INIT_STATE);
    this.load();
  }

  get chatId(): string {
    return this._config.chatId;
  }

  destroy() {
    // Destroy all child objects & processes
  }

  disconnect() {
    if (!this._callbacks) {
      return;
    }

    // Dispatch init values
    this._callbacks.setIsRunning(INIT_STATE.isRunning);
    this._callbacks.setChatLog([]);

    // Disconnect all callbacks
    this._callbacks = undefined;
  }

  async connect(callbacks: EvoThreadCallbacks): Promise<void> {
    // Save callbacks
    this._callbacks = callbacks;

    // Wait until loading has finished
    while (this._state.isLoading) {
      await new Promise((resolve) =>
        setTimeout(resolve, 200)
      );
    }

    if (!this._callbacks) {
      return;
    }

    // Send current state to newly connected callbacks
    this._callbacks.setIsRunning(this._state.isRunning);
    this._callbacks.setChatLog(this._state.logs);
  }

  async start(options: EvoThreadStartOptions) {
    const { isRunning } = this._state;
    const {
      goal,
      allowTelemetry,
      openAiApiKey
    } = options;

    if (isRunning) {
      this._callbacks?.onError("A goal is already underway.");
      return;
    }

    this.setIsRunning(true);

    // Acquire a GoalID
    const subsidize = !openAiApiKey;
    const goalId = await GoalApi.create(
      this.chatId,
      allowTelemetry ? goal : "<redacted>",
      subsidize,
      () => this._callbacks?.onGoalCapReached()
    );

    if (!goalId) {
      this._callbacks?.onError("Unable to acquire a goal ID.");
      return;
    }

    // Create an Evo instance
    const evo = createEvoInstance(
      goalId,
      options.workspace,
      options.openAiApiKey,
      this._config.onMessagesAdded,
      this._config.onVariableSet,
      (chatLog) =>
        this.onChatLog(chatLog) || Promise.resolve(),
      () =>
        this._callbacks?.onGoalCapReached(),
      // onError
      (error) =>
        this._callbacks?.onError(error)
    );

    if (!evo) {
      return;
    }

    // Run the evo instance against the goal
    await this.runEvo(evo, options.goal);
  }

  private async load() {
    this._state.isLoading = true;
    this._state.logs = await this._config.loadChatLog(
      this._config.chatId
    ).catch((reason) => {
      this._callbacks?.onError(reason.toString());
      return [];
    });
    this._state.isLoading = false;
  }

  private setIsRunning(value: boolean) {
    this._state.isRunning = value;
    this._callbacks?.setIsRunning(value);
  }

  private async onChatLog(chatLog: ChatLog): Promise<void> {
    this._state.logs.push(chatLog);
    this._callbacks?.setChatLog(this._state.logs);
    await this._config.onChatLogAdded(chatLog);
  }

  private async runEvo(evo: Evo, goal: string): Promise<void> {
    const iterator = evo.run({ goal });

    await this.onChatLog({
      title: goal,
      user: "user"
    });

    let stepCounter = 1;

    while (this._state.isRunning) {
      const response = await iterator.next();

      if (response.done) {
        console.log(response.value);
        const actionTitle = response.value.value.title;
        if (
          actionTitle.includes("onGoalAchieved") ||
          actionTitle === "SUCCESS"
        ) {
          await this.onChatLog({
            title: "## Goal Achieved",
            user: "evo",
          });
        }

        this.setIsRunning(false);
        evo?.reset();
        break;
      }

      await this.onChatLog({
        title: `## Step ${stepCounter}`,
        user: "evo",
      });

      if (!response.done) {
        const evoMessage = {
          title: `### Action executed:\n${response.value.title}`,
          content: response.value.content,
          user: "evo",
        };
        await this.onChatLog(evoMessage);
      }

      stepCounter++;
    }
  }
}

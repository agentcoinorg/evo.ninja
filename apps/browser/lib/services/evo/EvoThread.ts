import { createEvoInstance } from "@/lib/services/evo/createEvoInstance";
import { GoalApi, ProxyEmbeddingApi, ProxyLlmApi } from "@/lib/api";
import { ChatLog } from "@/components/Chat";
import {
  Evo,
  ChatLogType,
  ChatMessage,
  Workspace,
  InMemoryWorkspace,
  EmbeddingApi,
  LlmApi,
} from "@evo-ninja/agents";

export interface EvoThreadConfig {
  chatId: string;
  loadChatLog: (chatId: string) => Promise<ChatLog[]>;
  loadWorkspace: (chatId: string) => Promise<Workspace>;
  onChatLogAdded: (chatLog: ChatLog) => Promise<void>;
  onMessagesAdded: (
    type: ChatLogType,
    messages: ChatMessage[]
  ) => Promise<void>;
  onVariableSet: (key: string, value: string) => Promise<void>;
}

export interface EvoThreadState {
  goal: string | undefined;
  evo: Evo | undefined;
  llm: LlmApi | undefined;
  embedding: EmbeddingApi | undefined;
  status: string | undefined;
  isRunning: boolean;
  isLoading: boolean;
  logs: ChatLog[];
  workspace: Workspace;
}

export interface EvoThreadCallbacks {
  setStatus: (status?: string) => void;
  setIsRunning: (value: boolean) => void;
  setChatLog: (chatLog: ChatLog[]) => void;
  setWorkspace: (workspace: Workspace | undefined) => Promise<void>;
  onGoalCapReached: () => void;
  onError: (error: string) => void;
}

export interface EvoThreadStartOptions {
  goal: string;
  allowTelemetry: boolean;
  openAiApiKey?: string;
}

const INIT_STATE: EvoThreadState = {
  goal: undefined,
  evo: undefined,
  llm: undefined,
  embedding: undefined,
  status: undefined,
  isRunning: false,
  isLoading: false,
  logs: [],
  workspace: new InMemoryWorkspace()
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

    // Dispatch reset values
    this._callbacks.setStatus(INIT_STATE.status);
    this._callbacks.setIsRunning(INIT_STATE.isRunning);
    this._callbacks.setChatLog(INIT_STATE.logs);
    this._callbacks.setWorkspace(undefined);

    // Disconnect all callbacks
    this._callbacks = undefined;
  }

  async connect(callbacks: EvoThreadCallbacks): Promise<void> {
    // Save callbacks
    this._callbacks = callbacks;

    // Wait until loading has finished
    await this.waitForLoad();

    if (!this._callbacks) {
      return;
    }

    // Send current state to newly connected callbacks
    this._callbacks.setStatus(this._state.status);
    this._callbacks.setIsRunning(this._state.isRunning);
    this._callbacks.setChatLog(this._state.logs);
    await this._callbacks.setWorkspace(this._state.workspace);
  }

  async start(options: EvoThreadStartOptions): Promise<void> {
    const {
      goal,
      allowTelemetry,
      openAiApiKey
    } = options;

    if (this._state.isRunning) {
      if (this._state.goal !== options.goal) {
        this._callbacks?.onError("A goal is already underway.");
      }
      return;
    }

    this._state.goal = options.goal;
    this.setIsRunning(true);

    // Wait until loading has finished
    await this.waitForLoad();

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
      this.setIsRunning(false);
      return;
    }

    if (this._state.evo && this._state.llm && this._state.embedding) {
      console.log("Reusing existing Evo instance");
    } else {
      console.log("Creating new Evo instance");
      // Create an Evo instance
      const result = createEvoInstance(
        this._state.workspace,
        options.openAiApiKey,
        this._config.onMessagesAdded,
        this._config.onVariableSet,
        (chatLog) => this.onChatLog(chatLog),
        (status) => this.onStatusUpdate(status),
        () => this._callbacks?.onGoalCapReached(),
        // onError
        (error) => this._callbacks?.onError(error)
      );

      if (!result) {
        this.setIsRunning(false);
        return;
      }

      console.log("Evo instance created", result);

      this._state.evo = result.evo;
      this._state.llm = result.llm;
      this._state.embedding = result.embedding;
    }

    if (this._state.llm instanceof ProxyLlmApi) {
      console.log("Setting goal ID1", goalId);
      this._state.llm.setGoalId(goalId);
    } 
    if (this._state.embedding instanceof ProxyEmbeddingApi) {
      console.log("Setting goal ID2", goalId);
      this._state.embedding.setGoalId(goalId);
    }

    // Run the evo instance against the goal
    await this.runEvo(this._state.evo, options.goal);
    this._state.goal = undefined;
  }

  private async load() {
    const chatId = this._config.chatId;
    this._state.isLoading = true;

    const results = await Promise.all<[
      Promise<ChatLog[]>,
      Promise<Workspace>
    ]>([
      this._config.loadChatLog(chatId).catch((reason) => {
        this._callbacks?.onError(reason.toString());
        return [];
      }),
      this._config.loadWorkspace(chatId).catch((reason) => {
        this._callbacks?.onError(reason.toString());
        return new InMemoryWorkspace();
      })
    ]);

    this._state.logs = results[0];
    this._state.workspace = results[1];
    this._state.isLoading = false;
  }

  private async waitForLoad() {
    while (this._state.isLoading) {
      await new Promise((resolve) =>
        setTimeout(resolve, 200)
      );
    }
    return Promise.resolve();
  }

  private setIsRunning(value: boolean) {
    this._state.isRunning = value;
    this._callbacks?.setIsRunning(value);
  }

  private async onChatLog(chatLog: ChatLog): Promise<void> {
    this._state.logs = [...this._state.logs, chatLog];
    this._callbacks?.setChatLog(this._state.logs);
    await this._config.onChatLogAdded(chatLog);
  }

  private onStatusUpdate(status: string): void {
    this._state.status = status;
    this._callbacks?.setStatus(status);
  }

  private async runEvo(evo: Evo, goal: string): Promise<void> {
    const iterator = evo.run({ goal });

    await this.onChatLog({
      title: goal,
      user: "user"
    });

    let stepCounter = 1;

    while (this._state.isRunning) {
      await this.onChatLog({
        title: `## Step ${stepCounter}`,
        user: "evo",
      });
      const response = await iterator.next();

      this._callbacks?.setWorkspace(this._state.workspace);

      if (response.done) {
        // If value is not present is because an unhandled error has happened in Evo
        if ("value" in response.value) {
          const isSuccess = response.value.value.type === "success";
          const message = {
            title: `## Goal has ${isSuccess ? "" : "not"} been achieved`,
            user: "evo",
          };
          await this.onChatLog(message);
        }
        this.setIsRunning(false);
        evo?.reset();
        break;
      }

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

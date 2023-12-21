import {
  EvoThread,
  EvoThreadStartOptions,
  EvoThreadCallbacks,
  EvoThreadConfig,
} from "./EvoThread";

export class EvoService {
  private _threads: Record<string, EvoThread> = {};
  private _current: EvoThread | undefined;

  constructor(
    public user: string
  ) { }

  get current(): EvoThread | undefined {
    return this._current;
  }

  destroy() {
    for (const thread of Object.values(this._threads)) {
      thread.destroy();
    }
    this._threads = {};
    this._current = undefined;
  }

  disconnect() {
    this._current?.disconnect();
    this._current = undefined;
  }

  async connect(config: EvoThreadConfig, callbacks: EvoThreadCallbacks): Promise<void> {
    this._current = this.acquireThread(config);
    await this._current.connect(callbacks);
  }

  async start(options: EvoThreadStartOptions): Promise<void> {
    if (!this._current) {
      throw Error("EvoService must be connected before starting a goal.");
    }
    return this._current.start(options);
  }

  private acquireThread(config: EvoThreadConfig): EvoThread {
    if (!this._threads[config.chatId]) {
      this._threads[config.chatId] = new EvoThread(config);
    }
    return this._threads[config.chatId];
  }
}

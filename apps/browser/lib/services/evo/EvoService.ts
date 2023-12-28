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
    this._current = await this.acquireThread(config);
    await this._current.connect(callbacks);
  }

  async start(options: EvoThreadStartOptions): Promise<void> {
    if (!this._current) {
      throw Error("EvoService must be connected before starting a goal.");
    }
    return this._current.start(options);
  }

  private async acquireThread(config: EvoThreadConfig): Promise<EvoThread> {
    if (!this._threads[config.chatId]) {
      this._threads[config.chatId] = await EvoThread.load(config);
    }
    return this._threads[config.chatId];
  }
}

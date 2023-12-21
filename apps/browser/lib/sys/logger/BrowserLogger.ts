import { ILogger } from "@evo-ninja/agent-utils";

type LogLevel = "info" | "warning" | "error";

export interface BrowserLoggerConfig {
  onLog(markdown: string): Promise<void>;
  onLogLevel?: Partial<Record<LogLevel, (markdown: string) => Promise<void>>>;
  onNotice: (markdown: string) => Promise<void>;
  onSuccess: (markdown: string) => Promise<void>;
}

export class BrowserLogger implements ILogger {
  constructor(private _config: BrowserLoggerConfig) {}

  async notice(msg: string): Promise<void> {
    await this._config.onNotice(msg);
  }

  async success(msg: string): Promise<void> {
    await this._config.onSuccess(msg);
  }

  async info(info: string): Promise<void> {
    await Promise.all([
      this._config.onLog(info),
      this.getOnLogLevel("info")(info)
    ]);
  }

  async warning(msg: string): Promise<void> {
    await Promise.all([
      this._config.onLog(msg),
      this.getOnLogLevel("warning")(msg),
    ]);
  }

  async error(msg: string): Promise<void> {
    await Promise.all([
      this._config.onLog(msg),
      this.getOnLogLevel("error")(msg)
    ]);
  }

  private getOnLogLevel(level: LogLevel): (msg: string) => Promise<void> {
    return (
      this._config.onLogLevel && this._config.onLogLevel[level]
    ) || (
      () => Promise.resolve()
    );
  }
}

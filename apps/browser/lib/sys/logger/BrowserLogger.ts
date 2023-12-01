import { ILogger } from "@evo-ninja/agent-utils";

export interface BrowserLoggerConfig {
  onLog(markdown: string): void;
}

export class BrowserLogger implements ILogger {
  constructor(
    private _config: BrowserLoggerConfig
  ) { }

  info(info: string): void {
    this._config.onLog(info)
  }


  notice(msg: string): void {
    this._config.onLog(msg);
  }

  success(msg: string): void {
    this._config.onLog(msg);
  }

  warning(msg: string): void {
    this._config.onLog(msg);
  }

  error(msg: string): void {
    this._config.onLog(msg);
  }
}

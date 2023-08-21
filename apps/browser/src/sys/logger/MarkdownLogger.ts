import { ILogger, Message } from "@evo-ninja/core";

export interface MarkdownLoggerConfig {
  onLog(markdown: string): void;
}

export class MarkdownLogger implements ILogger {
  constructor(
    private _config: MarkdownLoggerConfig
  ) { }

  info(info: string): void {
    this._config.onLog(
      `**Info:**\n${info}`
    );
  }

  message(msg: Message): void {
    const roleUpper = msg.role[0].toUpperCase() + (
      msg.role.length > 1 ? msg.role.substring(1) : ""
    );

    this._config.onLog(`**"${roleUpper}" Message**:\n${msg.content}`);
  }

  action(msg: Message): void {
    const roleUpper = msg.role[0].toUpperCase() + (
      msg.role.length > 1 ? msg.role.substring(1) : ""
    );

    this._config.onLog(`**"${roleUpper}" Action**:\n${msg.content}`);
  }

  notice(msg: string): void {
    this._config.onLog(
      `**Notice!**\n${msg}`
    );
  }

  success(msg: string): void {
    this._config.onLog(
      `**Success!**\n${msg}`
    );
  }

  error(msg: string): void {
    this._config.onLog(`**ERROR:**\n${msg}`);
  }
}

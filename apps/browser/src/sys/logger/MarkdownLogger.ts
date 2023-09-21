import { ILogger, ChatMessage } from "@evo-ninja/agent-utils";

export interface MarkdownLoggerConfig {
  onLog(markdown: string, color?: string): void;
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

  message(msg: ChatMessage): void {
    const roleUpper = msg.role[0].toUpperCase() + (
      msg.role.length > 1 ? msg.role.substring(1) : ""
    );

    this._config.onLog(`**"${roleUpper}" Message**:\n${msg.content}`);
  }

  action(msg: ChatMessage): void {
    const roleUpper = msg.role[0].toUpperCase() + (
      msg.role.length > 1 ? msg.role.substring(1) : ""
    );

    this._config.onLog(`**"${roleUpper}" Action**:\n${msg.content}`);
  }

  notice(msg: string): void {
    this._config.onLog(msg, "cyan");
  }

  success(msg: string): void {
    this._config.onLog(
      `**Success!**\n${msg}`,
      "green"
    );
  }

  warning(msg: string): void {
    this._config.onLog(
      `**Warning:** ${msg}`,
      "yellow"
    );
  }

  error(msg: string): void {
    this._config.onLog(`**ERROR:**\n${msg}`, "red");
  }
}

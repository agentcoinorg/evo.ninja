import { ConsoleLogger } from "./console";
import { FileLogger } from "./file";
import { Message } from "../../llm";

import chalk from "chalk";
import figlet from "figlet";
import clui from "clui";
import * as read from "readline";

const readline = read.promises.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export interface ILogger {
  info: (info: string) => void;
  message: (msg: Message) => void;
  action: (msg: Message) => void;
  notice: (msg: string) => void;
  success: (msg: string) => void;
  error: (msg: string, error?: unknown) => void;
}

export class Logger implements ILogger {
  protected _logDir: string = "chats";
  protected _loggers: ILogger[];
  protected _fileLogger: FileLogger;
  protected _spinner: clui.Spinner = new clui.Spinner("Thinking...");

  constructor(logDir?: string) {
    if (logDir) {
      this._logDir = logDir;
    }

    // Generate a unique log file name
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
    const logFile = `${this._logDir}/chat_${formattedDate}.md`;

    this._fileLogger = new FileLogger(logFile);
    this._loggers = [
      new ConsoleLogger(),
      this._fileLogger
    ];
  }

  get spinner() {
    return this._spinner;
  }

  info(info: string) {
    this._loggers.forEach((l) => l.info(info));
  }

  message(msg: Message) {
    this._loggers.forEach((l) => l.message(msg));
  };

  action(msg: Message) {
    this._loggers.forEach((l) => l.action(msg));
  }

  notice(msg: string) {
    this._loggers.forEach((l) => l.notice(msg));
  }

  success(msg: string) {
    this._loggers.forEach((l) => l.success(msg));
  }

  error(msg: string, error?: unknown) {
    if (!error) {
      this._loggers.forEach((l) => l.error(msg));
      return;
    }

    let errorStr: string = "";
    let errorObj = error as Record<string, unknown>;
    if (
      typeof error === "object" &&
      errorObj.message
    ) {
      if (errorObj.response) {
        const responseObj = errorObj.response as Record<string, unknown>;
        const status = responseObj.status || "N/A";
        const data = responseObj.data || "N/A";
        errorStr += `\nResponse Status: ${status}`;
        errorStr += `\nResponse Data: ${JSON.stringify(data, null, 2)}`;
      }
      errorStr += `\nMessage: ${errorObj.message}`;
    }

    this._loggers.forEach((l) => l.error(`${msg}${errorStr}`));
  }

  async question(query: string): Promise<string> {
    this._fileLogger.info(`**System**: ${query}\n`);
    const response = await readline.question(chalk.cyan(query));
    this._fileLogger.info(`**User**: ${response}\n`);
    return response;
  }

  async prompt(query: string): Promise<string> {
    const response = await readline.question(chalk.cyan(query));
    this._fileLogger.info(`**User**: ${response}\n`);
    return response;
  }

  logHeader() {
    const logger = this;

    figlet.text("EVO.NINJA", {
      font: "Slant",
      horizontalLayout: "default",
      verticalLayout: "default",
      whitespaceBreak: true
    }, function(err: Error | null, data?: string) {
      if (err) {
        logger.error("Something went wrong...", err);
        return;
      }
      logger.info("```\n" + data + "\n```\n");
      logger.info("Support: https://discord.polywrap.io");
    });
  }
}

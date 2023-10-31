import { ILogger } from "./";
import { ChatMessage } from "../../llm";

import chalk from "chalk";

export class ConsoleLogger implements ILogger {
  constructor() {}

  info(info: string): void {
    console.log(info);
  }

  message(msg: ChatMessage): void {
    const roleUpper =
      msg.role[0].toUpperCase() +
      (msg.role.length > 1 ? msg.role.substring(1) : "");

    this.info(`${roleUpper}: ${chalk.blue(msg.content)}`);
  }

  action(msg: ChatMessage): void {
    this.message(msg);
  }

  notice(msg: string): void {
    this.info(chalk.yellow(msg));
  }

  success(msg: string): void {
    this.info(chalk.green(msg));
  }

  warning(msg: string): void {
    this.info(chalk.yellow(msg));
  }

  error(msg: string): void {
    this.info(chalk.red(msg));
  }
}

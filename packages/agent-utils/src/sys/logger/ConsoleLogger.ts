import { ILogger } from "./";

import chalk from "chalk";

export class ConsoleLogger implements ILogger {
  constructor() { }

  info(info: string): void {
    console.log(info);
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

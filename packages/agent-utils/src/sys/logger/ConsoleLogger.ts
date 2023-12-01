import { ILogger } from "./";

import chalk from "chalk";

export class ConsoleLogger implements ILogger {
  constructor() {}

  async info(info: string): Promise<void> {
    console.log(info);
  }

  notice(msg: string): Promise<void> {
    return this.info(chalk.yellow(msg));
  }

  success(msg: string): Promise<void> {
    return this.info(chalk.green(msg));
  }

  warning(msg: string): Promise<void> {
    return this.info(chalk.yellow(msg));
  }

  error(msg: string): Promise<void> {
    return this.info(chalk.red(msg));
  }
}

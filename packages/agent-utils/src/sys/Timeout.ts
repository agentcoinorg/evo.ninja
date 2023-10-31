import { Logger } from "./logger";

export class Timeout {
  constructor(
    public seconds: number = 20 * 60,
    public callback: (logger: Logger) => void
  ) {}

  public get milliseconds(): number {
    return this.seconds * 1000;
  }
}

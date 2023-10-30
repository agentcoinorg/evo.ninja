import { ILogger } from "@evo-ninja/agent-utils";
import fs from "fs";
import path from "path-browserify";

export class FileLogger implements ILogger {
  constructor(
    private _filePath: string
  ) {
    // Make the log directory if it doesn't exist
    const logDir = path.dirname(this._filePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Delete the file if it exists
    if (fs.existsSync(this._filePath)) {
      fs.rmSync(this._filePath);
    }
  }

  info(info: string): void {
    fs.appendFileSync(this._filePath, info + "\n\n");
  }

  notice(msg: string): void {
    this.info(msg + "\n  \n");
  }

  success(msg: string): void {
    this.info(msg + "\n  \n");
  }

  warning(msg: string): void {
    this.info(msg + "\n  \n");
  }

  error(msg: string): void {
    this.info(msg + "\n  \n");
  }
}

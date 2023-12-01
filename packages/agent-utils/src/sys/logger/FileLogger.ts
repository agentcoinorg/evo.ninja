import path from "path-browserify";
import { ILogger } from "./Logger";
import { Workspace } from "../workspaces";

export class FileLogger implements ILogger {
  private constructor(
    private readonly _filePath: string,
    private readonly _workspace: Workspace
  ) {}

  static async create(
    filePath: string,
    workspace: Workspace
  ): Promise<FileLogger> {
    // Make the log directory if it doesn't exist
    const logDir = path.dirname(filePath);
    if (!(await workspace.exists(logDir))) {
      workspace.mkdir(logDir, { recursive: true });
    }

    // Delete the file if it exists
    if (await workspace.exists(filePath)) {
      await workspace.rm(filePath);
    }

    return new FileLogger(filePath, workspace);
  }

  async info(info: string): Promise<void> {
    await this._workspace.appendFile(this._filePath, info + "  \n");
  }

  notice(msg: string): Promise<void> {
    return this.info(msg + "  \n");
  }

  success(msg: string): Promise<void> {
    return this.info(msg + "  \n");
  }

  warning(msg: string): Promise<void> {
    return this.info(msg + "  \n");
  }

  error(msg: string): Promise<void> {
    return this.info(msg + "  \n");
  }
}

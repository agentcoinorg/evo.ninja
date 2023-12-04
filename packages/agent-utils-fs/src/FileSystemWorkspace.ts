import {
  Workspace,
  DirectoryEntry,
  SyncWorkspace,
} from "@evo-ninja/agent-utils";
import fs from "fs";
import path from "path-browserify";
import spawn from "spawn-command";

export class FileSystemWorkspace implements Workspace, SyncWorkspace {
  constructor(private _workspacePath: string) {
    // Fully resolve the workspace path
    this._workspacePath = path.resolve(this._workspacePath);

    // Initialize the directory
    if (!fs.existsSync(this._workspacePath)) {
      fs.mkdirSync(this._workspacePath, { recursive: true });
    }
  }

  toWorkspacePath(subpath: string): string {
    const absPath = path.resolve(
      !subpath.startsWith(this._workspacePath)
        ? path.join(this._workspacePath, subpath)
        : subpath
    );

    if (absPath.indexOf(this._workspacePath) !== 0) {
      throw Error(
        `Path must be within workspace directory. Path: ${subpath}\n` +
          `Workspace: ${this._workspacePath}`
      );
    }

    return absPath;
  }

  async writeFile(subpath: string, data: string): Promise<void> {
    const absPath = this.toWorkspacePath(subpath);
    await fs.promises.writeFile(absPath, data);
  }

  async readFile(subpath: string): Promise<string> {
    const absPath = this.toWorkspacePath(subpath);
    return fs.promises.readFile(absPath, "utf-8");
  }

  async exists(subpath: string): Promise<boolean> {
    const absPath = this.toWorkspacePath(subpath);
    return fs.existsSync(absPath);
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    const absOldPath = this.toWorkspacePath(oldPath);
    const absNewPath = this.toWorkspacePath(newPath);
    return fs.promises.rename(absOldPath, absNewPath);
  }

  async mkdir(subpath: string): Promise<void> {
    const absPath = this.toWorkspacePath(subpath);
    await fs.promises.mkdir(absPath, { recursive: true });
  }

  async rmdir(subpath: string, opts?: { recursive: boolean }): Promise<void> {
    const absPath = this.toWorkspacePath(subpath);
    return fs.promises.rmdir(absPath, opts);
  }

  async readdir(subpath: string): Promise<DirectoryEntry[]> {
    const absPath = this.toWorkspacePath(subpath);
    const items = await fs.promises.readdir(absPath, { withFileTypes: true });

    return items
      .filter((d) => !d.name.startsWith("."))
      .map((d) => ({
        name: d.name,
        type: d.isDirectory() ? "directory" : "file",
      }));
  }

  async appendFile(subpath: string, data: string): Promise<void> {
    const absPath = this.toWorkspacePath(subpath);
    return fs.promises.appendFile(absPath, data);
  }

  async rm(subpath: string): Promise<void> {
    const absPath = this.toWorkspacePath(subpath);
    return fs.promises.rm(absPath);
  }

  writeFileSync(subpath: string, data: string): void {
    const absPath = this.toWorkspacePath(subpath);
    fs.writeFileSync(absPath, data);
  }

  readFileSync(subpath: string): string {
    const absPath = this.toWorkspacePath(subpath);
    return fs.readFileSync(absPath, "utf-8");
  }

  existsSync(subpath: string): boolean {
    const absPath = this.toWorkspacePath(subpath);
    return fs.existsSync(absPath);
  }

  renameSync(oldPath: string, newPath: string): void {
    const absOldPath = this.toWorkspacePath(oldPath);
    const absNewPath = this.toWorkspacePath(newPath);
    return fs.renameSync(absOldPath, absNewPath);
  }

  rmSync(subpath: string): void {
    const absPath = this.toWorkspacePath(subpath);
    fs.rmSync(absPath);
  }

  mkdirSync(subpath: string, opts?: { recursive: boolean }): void {
    const absPath = this.toWorkspacePath(subpath);
    fs.mkdirSync(absPath, opts);
  }

  rmdirSync(subpath: string, opts?: { recursive: boolean }): void {
    const absPath = this.toWorkspacePath(subpath);
    return fs.rmdirSync(absPath, opts);
  }

  readdirSync(subpath: string): DirectoryEntry[] {
    const absPath = this.toWorkspacePath(subpath);
    const items = fs.readdirSync(absPath, { withFileTypes: true });

    return items
      .filter((d) => !d.name.startsWith("."))
      .map((d) => ({
        name: d.name,
        type: d.isDirectory() ? "directory" : "file",
      }));
  }

  appendFileSync(subpath: string, data: string): void {
    const absPath = this.toWorkspacePath(subpath);
    return fs.appendFileSync(absPath, data);
  }

  async exec(
    command: string,
    args?: string[],
    timeout?: number
  ): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return await new Promise((resolve, reject) => {
      const toExec = args ? `${command} ${args.join(" ")}` : command;
      const child = spawn(toExec, { cwd: this._workspacePath });

      let stdout = "";
      let stderr = "";

      if (timeout) {
        setTimeout(() => {
          child.kill();
          resolve({ exitCode: 1, stdout: "Timeout achieved", stderr: "" });
        }, timeout);
      }

      child.on("error", (error: Error) => {
        reject(error);
      });

      child.stdout?.on("data", (data: string) => {
        stdout += data.toString();
      });

      child.stderr?.on("data", (data: string) => {
        stderr += data.toString();
      });

      child.on("exit", (exitCode: number) => {
        resolve({ exitCode, stdout, stderr });
      });
    });
  }
}

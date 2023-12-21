import path from "path-browserify";
import { DirectoryEntry } from "./DirectoryEntry";
import { Workspace } from "./Workspace";

export class SubWorkspace implements Workspace {
  constructor(
    public readonly subpath: string,
    public readonly workspace: Workspace
  ) {}

  writeFile(subpath: string, data: string): Promise<void> {
    return this.workspace.writeFile(this.toSubpath(subpath), data);
  }

  readFile(subpath: string): Promise<string> {
    return this.workspace.readFile(this.toSubpath(subpath));
  }

  exists(subpath: string): Promise<boolean> {
    return this.workspace.exists(this.toSubpath(subpath));
  }

  rename(oldPath: string, newPath: string): Promise<void> {
    return this.workspace.rename(
      this.toSubpath(oldPath),
      this.toSubpath(newPath)
    );
  }

  mkdir(
    subpath: string,
    opts: { recursive: boolean } = { recursive: false }
  ): Promise<void> {
    return this.workspace.mkdir(this.toSubpath(subpath), opts);
  }

  rmdir(subpath: string, opts: { recursive: boolean }): Promise<void> {
    return this.workspace.rmdir(this.toSubpath(subpath), opts);
  }

  readdir(subpath: string): Promise<DirectoryEntry[]> {
    return this.workspace.readdir(this.toSubpath(subpath));
  }

  appendFile(subpath: string, data: string): Promise<void> {
    return this.workspace.appendFile(this.toSubpath(subpath), data);
  }

  rm(subpath: string): Promise<void> {
    return this.workspace.rm(this.toSubpath(subpath));
  }

  async exec(
    command: string,
    args?: string[]
  ): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return this.workspace.exec(command, args);
  }

  private toSubpath(subpath: string): string {
    return path.join(this.subpath, subpath);
  }
}

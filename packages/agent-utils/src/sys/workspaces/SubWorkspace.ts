import { Workspace, DirectoryEntry } from "./Workspace";

import path from "path-browserify";

export class SubWorkspace implements Workspace {
  constructor(
    public readonly subpath: string,
    public readonly workspace: Workspace
  ) { }

  writeFileSync(subpath: string, data: string): void {
    this.workspace.writeFileSync(this.toSubpath(subpath), data);
  }

  readFileSync(subpath: string): string {
    return this.workspace.readFileSync(this.toSubpath(subpath));
  }

  existsSync(subpath: string): boolean {
    return this.workspace.existsSync(this.toSubpath(subpath));
  }

  renameSync(oldPath: string, newPath: string): void {
    this.workspace.renameSync(
      this.toSubpath(oldPath),
      this.toSubpath(newPath)
    );
  }

  mkdirSync(subpath: string, opts: { recursive: boolean } = { recursive: false }): void {
    this.workspace.mkdirSync(this.toSubpath(subpath), opts);
  }

  rmdirSync(subpath: string, opts: { recursive: boolean }): void {
    this.workspace.rmdirSync(this.toSubpath(subpath), opts);
  }

  readdirSync(subpath: string): DirectoryEntry[] {
    return this.workspace.readdirSync(this.toSubpath(subpath));
  }

  appendFileSync(subpath: string, data: string): void {
    this.workspace.appendFileSync(this.toSubpath(subpath), data);
  }

  rmSync(subpath: string): void {
    this.workspace.rmSync(this.toSubpath(subpath));
  }

  async exec(command: string, args?: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return this.workspace.exec(command, args);
  }

  private toSubpath(subpath: string): string {
    return path.join(this.subpath, subpath);
  }
}

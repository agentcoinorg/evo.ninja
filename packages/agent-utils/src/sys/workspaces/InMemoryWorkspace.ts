import { DirectoryEntry, Workspace } from "./Workspace";
import { InMemoryFS } from "./InMemoryFS";

export class InMemoryWorkspace implements Workspace {
  private fs: InMemoryFS = new InMemoryFS();

  writeFileSync(subpath: string, data: string): void {
    this.fs.writeFileSync(subpath, data);
  }

  readFileSync(subpath: string): string {
    return this.fs.readFileSync(subpath);
  }

  existsSync(subpath: string): boolean {
    return this.fs.existsSync(subpath);
  }

  renameSync(oldPath: string, newPath: string): void {
    this.fs.renameSync(oldPath, newPath);
  }

  mkdirSync(subpath: string): void {
    this.fs.mkdirSync(subpath);
  }

  readdirSync(subpath: string): DirectoryEntry[] {
    return this.fs.readdirSync(subpath)
      .filter((d) => !d.name.startsWith("."));
  }

  appendFileSync(subpath: string, data: string): void {
    this.fs.appendFileSync(subpath, data);
  }

  async exec(command: string, args?: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    throw new Error("Executing commands is not supported in this application environment.");
  }
}

import { InMemoryFS } from "./InMemoryFS";

export class InMemoryWorkspace {
  private fs: InMemoryFS = new InMemoryFS();

  constructor(
  ) {
  }

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

  readdirSync(subpath: string): string[] {
    return this.fs.readdirSync(subpath);
  }

  appendFileSync(subpath: string, data: string): void {
    this.fs.appendFileSync(subpath, data);
  }
}

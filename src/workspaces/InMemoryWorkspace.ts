import path from "path";
import { InMemoryFS } from ".";

export class InMemoryWorkspace {
  private fs: InMemoryFS = new InMemoryFS();

  constructor(
    private _workspacePath: string = path.join(__dirname, "../../workspace")
  ) {
    // Fully resolve the workspace path
    this._workspacePath = path.resolve(
      this._workspacePath
    );

    // Initialize the directory
    if (!this.fs.existsSync(this._workspacePath)) {
      this.fs.mkdirSync(
        this._workspacePath,
        { recursive: true }
      );
    }
  }

  toWorkspacePath(subpath: string): string {
    const absPath = path.isAbsolute(subpath) ?
      subpath :
      path.resolve(path.join(this._workspacePath, subpath));

    if (absPath.indexOf(this._workspacePath) !== 0) {
      throw Error(
        `Path must be within workspace directory. Path: ${subpath}\n` +
        `Workspace: ${this._workspacePath}`
      );
    }

    return absPath;
  }

  writeFileSync(subpath: string, data: string): void {
    const absPath = this.toWorkspacePath(subpath);
    this.fs.writeFileSync(absPath, data);
  }

  readFileSync(subpath: string): string {
    const absPath = this.toWorkspacePath(subpath);
    return this.fs.readFileSync(absPath);
  }

  existsSync(subpath: string): boolean {
    const absPath = this.toWorkspacePath(subpath);
    return this.fs.existsSync(absPath);
  }
}

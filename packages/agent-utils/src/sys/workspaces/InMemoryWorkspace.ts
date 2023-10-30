import path from "path-browserify";
import { DirectoryEntry, Workspace } from "./Workspace";

export class InMemoryWorkspace implements Workspace {
  private root: InMemoryDir = new InMemoryDir("");

  async exec(command: string, args?: string[], timeout?: number): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    throw new Error("Executing commands is not supported in this application environment.");
  }

  mkdirSync(subpath: string, opt: { recursive: boolean } = { recursive: false }): void {
    const path = subpath.split("/");

    if (opt.recursive) {
      let currentDir = this.root;

      for (const segment of path) {
        if (!currentDir.getDirectory(segment)) {
          currentDir.addEntry(new InMemoryDir(segment));
        }
        currentDir = currentDir.getDirectory(segment) as InMemoryDir; // Safe cast since we just created it if it didn't exist
      }
    } else {
      const [parentDir, dirName] = this.navigateToPath(path);
      if (parentDir.getDirectory(dirName)) {
        throw new Error(`Directory already exists: ${subpath}`);
      }
      parentDir.addEntry(new InMemoryDir(dirName));
    }
  }

  rmdirSync(subpath: string, opt: { recursive: boolean }): void {
    const path = subpath.split("/");
    const [parentDir, dirName] = this.navigateToPath(path);
    const dir = parentDir.getDirectory(dirName);
    if (!dir) {
      throw new Error(`Directory not found: ${subpath}`);
    }

    if (!opt.recursive && dir.getEntries().length > 0) {
      throw new Error(`Directory not empty: ${subpath}`);
    }

    parentDir.removeEntry(dirName);
  }

  readdirSync(subpath: string): DirectoryEntry[] {
    const path = subpath.split("/");
    let currentDir: InMemoryDir;

    if (path.length === 1 && path[0] === "") {
      currentDir = this.root; // Root directory
    } else {
      const [parentDir, dirName] = this.navigateToPath(path);
      const directory = parentDir.getDirectory(dirName);
      if (!directory) {
        throw new Error(`Directory not found: ${subpath}`);
      }
      currentDir = directory;
    }

    return currentDir.getEntries()
      .map((x) => ({
        name: x.name,
        type: x.type
      } as DirectoryEntry))
      .filter((d) => !d.name.startsWith("."));
  }

  writeFileSync(filePath: string, data: string): void {
    const path = filePath.split("/");
    const [parentDir, fileName] = this.navigateToPath(path);
    parentDir.addEntry(new InMemoryFile(fileName, data));
  }

  readFileSync(filePath: string): string {
    const path = filePath.split("/");
    const [parentDir, fileName] = this.navigateToPath(path);
    const file = parentDir.getFile(fileName);
    if (!file) {
      throw new Error(`File not found: ${filePath}`);
    }
    return file.read();
  }

  existsSync(pathStr: string): boolean {
    try {
      const path = pathStr.split("/");
      const [parentDir, name] = this.navigateToPath(path);
      return parentDir.getFile(name) !== undefined || parentDir.getDirectory(name) !== undefined;
    } catch (error) {
      return false;
    }
  }

  renameSync(oldPath: string, newPath: string): void {
    const oldPathSegments = oldPath.split("/");
    const [oldParentDir, oldName] = this.navigateToPath(oldPathSegments);

    const newPathSegments = newPath.split("/");
    const [newParentDir, newName] = this.navigateToPath(newPathSegments);

    const item = oldParentDir.getFile(oldName) || oldParentDir.getDirectory(oldName);
    if (!item) {
      throw new Error(`Path not found: ${oldPath}`);
    }

    // Ensure new path doesn't already exist
    if (newParentDir.getFile(newName) || newParentDir.getDirectory(newName)) {
      throw new Error(`Destination path already exists: ${newPath}`);
    }

    newParentDir.addEntry(item);
    oldParentDir.removeEntry(oldName);
  }

  appendFileSync(subpath: string, data: string): void {
    const pathSegments = subpath.split("/");
    const [parentDir, fileName] = this.navigateToPath(pathSegments);
    
    let file = parentDir.getFile(fileName);
    if (file) {
      // If file exists, append data
      file.write(file.read() + data);
    } else {
      // If file doesn't exist, create a new one with the data
      parentDir.addEntry(new InMemoryFile(fileName, data));
    }
  }

  private navigateToPath(path: string[]): [InMemoryDir, string] {
    let currentDir = this.root;
    for (let i = 0; i < path.length - 1; i++) {
      if (path[i] === "." || path[i] === "./") {
        continue;
      }
      const nextDir = currentDir.getDirectory(path[i]);
      if (!nextDir) {
        throw new Error(`Path not found: ${path.slice(0, i + 1).join("/")}`);
      }
      currentDir = nextDir;
    }
    return [currentDir, path[path.length - 1]];
  }
}

class InMemoryFile implements DirectoryEntry {
  public readonly type = "file";

  constructor(
    public readonly name: string,
    private _data: string
  ) { }

  read(): string {
    return this._data;
  }

  write(data: string): void {
    this._data = data;
  }
}

class InMemoryDir implements DirectoryEntry {
  public readonly type = "directory";

  constructor(
    public readonly name: string,
    private _entries: Map<string, InMemoryFile | InMemoryDir> = new Map()
  ) { }

  addEntry(entry: InMemoryFile | InMemoryDir): void {
    this._entries.set(entry.name, entry);
  }

  removeEntry(name: string): boolean {
    return this._entries.delete(name);
  }

  getFile(name: string): InMemoryFile | undefined {
    const item = this._entries.get(name);
    if (item?.type === "file") {
      return item;
    }

    return undefined;
  }

  getDirectory(name: string): InMemoryDir | undefined {
    const item = this._entries.get(name);

    if (item?.type === "directory") {
      return item;
    }

    return undefined;
  }

  getEntries(): (InMemoryFile | InMemoryDir)[] {
    return Array.from(this._entries.values())
  }
}

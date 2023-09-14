export class InMemoryFile {
  private data: string;

  constructor(data: string = "") {
      this.data = data;
  }

  read(): string {
    return this.data;
  }

  write(data: string): void {
    this.data = data;
  }
}

export class InMemoryDir {
  private content: Map<string, InMemoryFile | InMemoryDir>;

  constructor() {
    this.content = new Map();
  }

  setFile(name: string, file: InMemoryFile): void {
    this.content.set(name, file);
  }

  setDirectory(name: string, dir: InMemoryDir): void {
    this.content.set(name, dir);
  }

  getFile(name: string): InMemoryFile | undefined {
    const item = this.content.get(name);
    if (item instanceof InMemoryFile) {
        return item;
    }

    return undefined;
  }

  getDirectory(name: string): InMemoryDir | undefined {
    const item = this.content.get(name);
    if (item instanceof InMemoryDir) {
        return item;
    }

    return undefined;
  }

  remove(name: string): boolean {
      return this.content.delete(name);
  }
}

export class InMemoryFS {
  private root: InMemoryDir;

  constructor() {
      this.root = new InMemoryDir();
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

  writeFileSync(filePath: string, data: string): void {
      const path = filePath.split("/");
      const [parentDir, fileName] = this.navigateToPath(path);
      parentDir.setFile(fileName, new InMemoryFile(data));
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

  mkdirSync(dirPath: string, opt: { recursive: boolean } = { recursive: false }): void {
    const path = dirPath.split("/");

    if (opt.recursive) {
      let currentDir = this.root;

      for (const segment of path) {
        if (!currentDir.getDirectory(segment)) {
          currentDir.setDirectory(segment, new InMemoryDir());
        }
        currentDir = currentDir.getDirectory(segment) as InMemoryDir; // Safe cast since we just created it if it didn't exist
      }
    } else {
      const [parentDir, dirName] = this.navigateToPath(path);
      if (parentDir.getDirectory(dirName)) {
        throw new Error(`Directory already exists: ${dirPath}`);
      }
      parentDir.setDirectory(dirName, new InMemoryDir());
    }
  }

  rmdirSync(dirPath: string): void {
      const path = dirPath.split("/");
      const [parentDir, dirName] = this.navigateToPath(path);
      if (!parentDir.getDirectory(dirName)) {
          throw new Error(`Directory not found: ${dirPath}`);
      }
      parentDir.remove(dirName);
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

  readdirSync(dirPath: string): string[] {
      const path = dirPath.split("/");
      let currentDir: InMemoryDir;

      if (path.length === 1 && path[0] === "") {
          currentDir = this.root; // Root directory
      } else {
          const [parentDir, dirName] = this.navigateToPath(path);
          const directory = parentDir.getDirectory(dirName);
          if (!directory) {
              throw new Error(`Directory not found: ${dirPath}`);
          }
          currentDir = directory;
      }

      const result: string[] = [];
      for (const [name] of currentDir['content']) {
          result.push(name);
      }
      return result;
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

    if (item instanceof InMemoryFile) {
      newParentDir.setFile(newName, item);
    } else {
      newParentDir.setDirectory(newName, item as InMemoryDir);
    }

    oldParentDir.remove(oldName);
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
      parentDir.setFile(fileName, new InMemoryFile(data));
    }
  }
}
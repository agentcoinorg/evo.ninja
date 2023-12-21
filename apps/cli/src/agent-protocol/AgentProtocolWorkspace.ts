import { DirectoryEntry, Workspace } from "@evo-ninja/agent-utils";
import { FileSystemWorkspace } from "@evo-ninja/agent-utils-fs";
import { type Artifact, v4 as uuid } from "agent-protocol";
import path from "path";

export class AgentProtocolWorkspace implements Workspace {
  private _artifactLog: Map<string, Artifact>;
  private _fsWorkspace: FileSystemWorkspace;

  constructor(directoryPath: string) {
    this._artifactLog = new Map();
    this._fsWorkspace = new FileSystemWorkspace(directoryPath);
  }

  get artifacts(): Artifact[] {
    return Array.from(this._artifactLog.values()).filter(
      (x) => !x.relative_path?.startsWith(".")
    );
  }

  cleanArtifacts(): void {
    this._artifactLog = new Map();
  }

  async writeFile(subpath: string, data: string): Promise<void> {
    const artifact = createArtifact(subpath);
    this._artifactLog.set(subpath, artifact);
    await this._fsWorkspace.writeFile(subpath, data);
  }

  readFile(subpath: string): Promise<string> {
    return this._fsWorkspace.readFile(subpath);
  }

  exists(subpath: string): Promise<boolean> {
    return this._fsWorkspace.exists(subpath);
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    let artifact = this._artifactLog.get(oldPath);
    if (artifact) {
      this._artifactLog.delete(oldPath);
      artifact.file_name = newPath;
      this._artifactLog.set(newPath, artifact);
    } else {
      artifact = createArtifact(newPath);
      this._artifactLog.set(newPath, artifact);
    }
    await this._fsWorkspace.rename(oldPath, newPath);
  }

  async mkdir(subpath: string): Promise<void> {
    await this._fsWorkspace.mkdir(subpath);
  }

  async rmdir(subpath: string): Promise<void> {
    await this._fsWorkspace.rmdir(subpath);
  }

  readdir(subpath: string): Promise<DirectoryEntry[]> {
    return this._fsWorkspace.readdir(subpath);
  }

  async appendFile(subpath: string, data: string): Promise<void> {
    await this._fsWorkspace.appendFile(subpath, data);
    let artifact = this._artifactLog.get(subpath);
    if (!artifact) {
      artifact = createArtifact(subpath);
      this._artifactLog.set(subpath, artifact);
    }
  }

  async rm(subpath: string): Promise<void> {
    const artifact = this._artifactLog.get(subpath);
    if (artifact) {
      this._artifactLog.delete(subpath);
    }
    await this._fsWorkspace.rm(subpath);
  }

  async exec(
    command: string,
    args?: string[]
  ): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return await this._fsWorkspace.exec(command, args);
  }
}

const createArtifact = (
  filePath: string
): Artifact => {
  return {
    artifact_id: uuid(),
    agent_created: true,
    file_name: path.basename(filePath),
    relative_path:
      path.dirname(filePath) === "." ? null : path.dirname(filePath),
    created_at: Date.now().toString(),
  };
};

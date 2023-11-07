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
    return Array.from(this._artifactLog.values())
      .filter((x) => !x.relative_path?.startsWith("."));
  }

  cleanArtifacts(): void {
    this._artifactLog = new Map();
  }

  writeFileSync(subpath: string, data: string): void {
    const artifact = createArtifact(subpath);
    this._artifactLog.set(subpath, artifact);
    this._fsWorkspace.writeFileSync(subpath, data);
  }

  readFileSync(subpath: string): string {
    return this._fsWorkspace.readFileSync(subpath);
  }

  existsSync(subpath: string): boolean {
    return this._fsWorkspace.existsSync(subpath);
  }

  renameSync(oldPath: string, newPath: string): void {
    let artifact = this._artifactLog.get(oldPath);
    if (artifact) {
      this._artifactLog.delete(oldPath);
      artifact.file_name = newPath;
      this._artifactLog.set(newPath, artifact);
    } else {
      artifact = createArtifact(newPath);
      this._artifactLog.set(newPath, artifact);
    }
    this._fsWorkspace.renameSync(oldPath, newPath);
  }

  mkdirSync(subpath: string): void {
    this._fsWorkspace.mkdirSync(subpath);
  }

  rmdirSync(subpath: string): void {
    this._fsWorkspace.rmdirSync(subpath);
  }

  readdirSync(subpath: string): DirectoryEntry[] {
    return this._fsWorkspace.readdirSync(subpath);
  }

  appendFileSync(subpath: string, data: string): void {
    this._fsWorkspace.appendFileSync(subpath, data);
    let artifact = this._artifactLog.get(subpath);
    if (!artifact) {
      artifact = createArtifact(subpath);
      this._artifactLog.set(subpath, artifact);
    }
  }

  rmSync(subpath: string): void {
    const artifact = this._artifactLog.get(subpath);
    if (artifact) {
      this._artifactLog.delete(subpath);
    }
    this._fsWorkspace.rmSync(subpath);
  }

  async exec(command: string, args?: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
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

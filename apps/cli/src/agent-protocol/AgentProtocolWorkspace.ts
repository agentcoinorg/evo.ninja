import { DirectoryEntry, Workspace } from "@evo-ninja/agent-utils";
import { FileSystemWorkspace } from "@evo-ninja/agent-utils-fs";
import { type Artifact, v4 as uuid } from "agent-protocol";
import path from "path";
import fs from "fs";

interface ArtifactLog extends Artifact {
  data: string;
}

export class AgentProtocolWorkspace implements Workspace {
  private _artifactLog: Map<string, ArtifactLog>;
  private _fsWorkspace: FileSystemWorkspace;

  constructor(private directoryPath: string) {
    this._artifactLog = new Map();
    this._fsWorkspace = new FileSystemWorkspace(directoryPath);
  }

  writeFileSync(subpath: string, data: string): void {
    const artifact: ArtifactLog = {
      file_name: path.basename(subpath),
      agent_created: true,
      artifact_id: uuid(),
      relative_path:
        path.dirname(subpath) === "." ? null : path.dirname(subpath),
      created_at: Date.now().toString(),
      data,
    };
    this._artifactLog.set(subpath, artifact);
    this._fsWorkspace.writeFileSync(subpath, data);
  }

  readFileSync(subpath: string): string {
    const text = this._fsWorkspace.readFileSync(subpath);
    const artifact: ArtifactLog = {
      file_name: path.basename(subpath),
      agent_created: true,
      artifact_id: uuid(),
      relative_path:
        path.dirname(subpath) === "." ? null : path.dirname(subpath),
      created_at: Date.now().toString(),
      data: text,
    };
    this._artifactLog.set(subpath, artifact);
    return text;
  }

  existsSync(subpath: string): boolean {
    return this._fsWorkspace.existsSync(subpath);
  }

  renameSync(oldPath: string, newPath: string): void {
    const artifact = this._artifactLog.get(oldPath);
    if (!artifact) {
      throw new Error(`Artifact with oldPath: ${oldPath} not found`);
    }
    this._artifactLog.delete(oldPath);
    artifact.file_name = newPath; // Update the filename in the artifact itself
    this._artifactLog.set(newPath, artifact);
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
    const artifact = this._artifactLog.get(subpath);
    if (!artifact) {
      throw new Error(`Artifact with subpath: ${subpath} not found`);
    }
    artifact.data += data;
    this._fsWorkspace.appendFileSync(subpath, data);
  }

  getArtifacts(): Artifact[] {
    const artifacts: ArtifactLog[] = [];

    this.processArtifacts((artifact, filePath) => {
      artifacts.push(artifact);
    });

    return artifacts;
  }

  writeArtifacts(): void {
    if (!fs.existsSync(this.directoryPath)) {
      throw new Error(
        `Workspace directory path: ${this.directoryPath} does not exists`
      );
    }

    this.processArtifacts((artifact, filePath) => {
      fs.writeFileSync(filePath, artifact.data);
    });
  }

  cleanArtifacts(): void {
    this._artifactLog = new Map();
  }

  async exec(command: string, args?: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return await this._fsWorkspace.exec(command, args);
  }

  private processArtifacts(
    callback: (artifact: ArtifactLog, filePath: string) => void
  ): void {
    this._artifactLog.forEach((artifact) => {
      let artifactDirectoryPath = this.directoryPath;

      const filePath = path.join(artifactDirectoryPath, artifact.file_name);
      callback(artifact, filePath);
    });
  }
}

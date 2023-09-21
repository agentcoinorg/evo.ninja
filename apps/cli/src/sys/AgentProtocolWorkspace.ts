import { Workspace } from "@evo-ninja/agent-utils";
import { type Artifact, v4 as uuid } from "forked-agent-protocol";
import fs from "fs";
import path from "path";

interface ArtifactLog extends Artifact {
  data: string;
}

export class AgentProtocolWorkspace implements Workspace {
  private _artifactLog: Map<string, ArtifactLog>;

  constructor(private directoryPath: string) {
    this._artifactLog = new Map();
  }

  writeFileSync(subpath: string, data: string): void {
    if (subpath === ".msgs") return;
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
  }

  readFileSync(subpath: string): string {
    const text = fs.readFileSync(
      path.join(this.directoryPath, subpath),
      "utf-8"
    );
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
    return this._artifactLog.has(subpath);
  }

  renameSync(oldPath: string, newPath: string): void {
    const artifact = this._artifactLog.get(oldPath);
    if (!artifact) {
      throw new Error(`Artifact with oldPath: ${oldPath} not found`);
    }
    this._artifactLog.delete(oldPath);
    artifact.file_name = newPath; // Update the filename in the artifact itself
    this._artifactLog.set(newPath, artifact);
  }

  mkdirSync(subpath: string): void {
    // Since this is an in-memory representation, we don't need to create "directories" per se.
    // However, if you want to maintain a list of directories, you can use another Map or Set.
    // For now, this method can be left as a no-op.
  }

  readdirSync(subpath: string): string[] {
    // This can be implemented by iterating through the Map's keys and filtering by those
    // that start with the given subpath. However, for this example, it's just a placeholder.
    return []
  }

  appendFileSync(subpath: string, data: string): void {
    const artifact = this._artifactLog.get(subpath);
    if (!artifact) {
      throw new Error(`Artifact with subpath: ${subpath} not found`);
    }
    artifact.data += data;
  }

  createArtifacts(): Artifact[] {
    if (!fs.existsSync(this.directoryPath)) {
      fs.mkdirSync(this.directoryPath, { recursive: true });
    }

    const artifacts: ArtifactLog[] = [];
    this._artifactLog.forEach((artifact) => {
      let artifactDirectoryPath = this.directoryPath;

      // If the artifact has a relative_path, append it to the main directory
      if (artifact.relative_path) {
        artifactDirectoryPath = path.join(
          this.directoryPath,
          artifact.relative_path
        );
        if (!fs.existsSync(artifactDirectoryPath)) {
          fs.mkdirSync(artifactDirectoryPath, { recursive: true });
        }
      }

      const filePath = path.join(artifactDirectoryPath, artifact.file_name);
      fs.writeFileSync(filePath, artifact.data);
      artifacts.push(artifact);
    });

    return artifacts;
  }

  cleanArtifacts(): void {
    this._artifactLog = new Map();
  }
}

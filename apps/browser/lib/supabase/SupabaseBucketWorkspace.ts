import { DirectoryEntry } from "@evo-ninja/agent-utils";
import { StorageClient } from "@supabase/storage-js";
import * as path from "path-browserify";

const MAX_FILE_SIZE = "20MB";

export class SupabaseBucketWorkspace {
  constructor(
    public readonly chatId: string,
    private readonly supabaseStorage: StorageClient
  ) {}

  async init(): Promise<void> {}

  async writeFile(subpath: string, data: string): Promise<void> {
    const path = this.toWorkspacePath(subpath);

    const { error } = await this.supabaseStorage
      .from(this.bucketName)
      .upload(path, data);

    if (error) {
      throw error;
    }

    return;
  }

  async readFile(subpath: string): Promise<string> {
    const path = this.toWorkspacePath(subpath);

    const { data, error } = await this.supabaseStorage
      .from(this.bucketName)
      .download(path);

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("File not found");
    }

    return await data.text();
  }

  async exists(subpath: string): Promise<boolean> {
    const path = this.toWorkspacePath(subpath);

    const { data, error } = await this.supabaseStorage
      .from(this.bucketName)
      .download(path);

    if (error) {
      throw error;
    }

    return data !== null;
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    const absOldPath = this.toWorkspacePath(oldPath);
    const absNewPath = this.toWorkspacePath(newPath);

    const { error } = await this.supabaseStorage
      .from(this.bucketName)
      .move(absOldPath, absNewPath);

    if (error) {
      throw error;
    }
  }

  async mkdir(_subpath: string): Promise<void> {}

  async rmdir(subpath: string, opts?: { recursive: boolean }): Promise<void> {
    if (!opts?.recursive) {
      throw new Error("Non-recursive rmdir is not supported");
    }

    const path = this.toWorkspacePath(subpath);
    console.log("Removing dir", path);

    const { data: list, error: listError } = await this.supabaseStorage
      .from(this.bucketName)
      .list(path);

    if (listError) {
      throw listError;
    }
    const filesToRemove = list.map((x) => `${path}/${x.name}`);
    console.log("Files to remove", filesToRemove);

    if (filesToRemove.length === 0) {
      return;
    }

    const { data, error: removeError } = await this.supabaseStorage
      .from(this.bucketName)
      .remove(filesToRemove);

    console.log("Removed", data);

    if (removeError) {
      throw removeError;
    }
  }

  async readdir(subpath: string): Promise<DirectoryEntry[]> {
    const path = this.toWorkspacePath(subpath);

    const { data, error } = await this.supabaseStorage
      .from(this.bucketName)
      .list(path);

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("Directory not found");
    }

    return data
      .filter((x) => !x.name.startsWith("."))
      .map((x) => ({
        name: x.name,
        type: "file",
      }));
  }

  async appendFile(subpath: string, data: string): Promise<void> {
    const path = this.toWorkspacePath(subpath);

    const { data: existingData, error: readError } = await this.supabaseStorage
      .from(this.bucketName)
      .download(path);

    if (readError) {
      throw readError;
    }

    const newData = existingData ? existingData.text() + data : data;

    const { error: writeError } = await this.supabaseStorage
      .from(this.bucketName)
      .upload(path, newData);

    if (writeError) {
      throw writeError;
    }
  }

  async rm(subpath: string): Promise<void> {
    const path = this.toWorkspacePath(subpath);

    const { error } = await this.supabaseStorage
      .from(this.bucketName)
      .remove([path]);

    if (error) {
      throw error;
    }
  }

  async exec(
    _command: string,
    _args?: string[],
    _timeout?: number
  ): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    throw new Error(
      "Executing commands is not supported in this application environment."
    );
  }

  private toWorkspacePath(subpath: string): string {
    return path.resolve("/", this.chatId, subpath).slice(1);
  }

  private toWorkspacePathSegments(subpath: string): string[] {
    return this.toWorkspacePath(subpath).split("/").slice(1);
  }

  private async doesBucketExist(bucketName: string): Promise<boolean> {
    const { error } = await this.supabaseStorage.getBucket(bucketName);
    if (error) {
      if (error.message !== "Bucket not found") {
        throw error;
      } else {
        return false;
      }
    }

    return true;
  }

  private bucketName = "workspaces";
}

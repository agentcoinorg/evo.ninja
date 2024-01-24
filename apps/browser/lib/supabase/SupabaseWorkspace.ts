import { DirectoryEntry, Workspace } from "@evo-ninja/agent-utils";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./dbTypes";
import * as path from "path-browserify";

const BUCKET_NAME = "workspaces";

export class SupabaseWorkspace implements Workspace {
  constructor(
    public readonly chatId: string,
    public readonly supabase: SupabaseClient<Database>
  ) {}

  async writeFile(subpath: string, data: string): Promise<void> {
    const path = this.toWorkspacePath(subpath);
    await this.uploadWorkspaceFile(path, data);
  }

  async readFile(subpath: string): Promise<string> {
    const path = this.toWorkspacePath(subpath);

    const { data, error } = await this.supabase.storage
      .from(BUCKET_NAME)
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

    const { data, error } = await this.supabase.storage
      .from(BUCKET_NAME)
      .download(path);

    if (error) {
      throw error;
    }

    return data !== null;
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    const absOldPath = this.toWorkspacePath(oldPath);
    const absNewPath = this.toWorkspacePath(newPath);

    await this.renameWorkspaceFile(
      absOldPath,
      absNewPath
    );
  }

  async mkdir(_subpath: string): Promise<void> {}

  async rmdir(subpath: string, opts?: { recursive: boolean }): Promise<void> {
    if (!opts?.recursive) {
      throw new Error("Non-recursive rmdir is not supported");
    }

    const path = this.toWorkspacePath(subpath);
    const filesToRemove = await this.listWorkspaceFiles(path);

    if (filesToRemove.length === 0) {
      return;
    }

    await this.removeWorkspaceFiles(filesToRemove);
  }

  async readdir(subpath: string): Promise<DirectoryEntry[]> {
    const path = this.toWorkspacePath(subpath);
    const fileNames = (await this.listWorkspaceFiles(path))
      .map((file) => file.replace(`${path}/`, ""));

    return fileNames
      .filter((x) => !x.startsWith("."))
      .map((x) => ({
        name: x,
        type: "file",
      }));
  }

  async appendFile(subpath: string, data: string): Promise<void> {
    const path = this.toWorkspacePath(subpath);

    const { data: existingData, error: readError } = await this.supabase.storage
      .from(BUCKET_NAME)
      .download(path);

    if (readError) {
      throw readError;
    }

    const newData = existingData ? existingData.text() + data : data;

    await this.uploadWorkspaceFile(path, newData);
  }

  async rm(subpath: string): Promise<void> {
    const path = this.toWorkspacePath(subpath);
    await this.removeWorkspaceFiles([path]);
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
    return path.resolve(path.join(this.chatId, subpath));
  }

  private async listWorkspaceFiles(path: string): Promise<string[]> {
    const { data: list, error: listError } = await this.supabase
      .from("workspace_files")
      .select("path, chat_id")
      .eq("chat_id", this.chatId);

    if (listError) {
      throw listError;
    }

    return list
      .filter((x) => x)
      .filter((x) => x.path.includes(path))
      .map((x) => x.path) as string[];
  }

  private async uploadWorkspaceFile(path: string, data: string): Promise<void> {
    const { error: storageError } = await this.supabase.storage
      .from(BUCKET_NAME)
      .upload(path, data, { upsert: true });

    if (storageError) {
      throw storageError;
    }

    const { error: indexError } = await this.supabase
      .from("workspace_files")
      .upsert({
        chat_id: this.chatId,
        path: path
      }, {
        onConflict: "chat_id, path"
      });

    if (indexError) {
      throw indexError;
    }
  }

  private async removeWorkspaceFiles(paths: string[]): Promise<void> {
    const { error: storageError } = await this.supabase.storage
      .from(BUCKET_NAME)
      .remove(paths);

    if (storageError) {
      throw storageError;
    }

    const { error: indexError } = await this.supabase
      .from("workspace_files")
      .delete()
      .eq("chat_id", this.chatId)
      .in("path", paths);

    if (indexError) {
      throw indexError;
    }
  }

  private async renameWorkspaceFile(oldPath: string, newPath: string): Promise<void> {
    const { error: storageError } = await this.supabase.storage
      .from(BUCKET_NAME)
      .move(oldPath, newPath);

    if (storageError) {
      throw storageError;
    }

    const { error: indexError } = await this.supabase
      .from("workspace_files")
      .update({ path: newPath })
      .eq("chat_id", this.chatId)
      .eq("path", oldPath)

    if (indexError) {
      throw indexError;
    }
  }
}

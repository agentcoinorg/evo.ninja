import { DirectoryEntry } from "./DirectoryEntry";

export interface Workspace {
  writeFile(subpath: string, data: string): Promise<void>;
  readFile(subpath: string): Promise<string>;
  exists(subpath: string): Promise<boolean>;
  rename(oldPath: string, newPath: string): Promise<void>;
  rm(subpath: string): Promise<void>;
  mkdir(subpath: string, opts?: { recursive: boolean }): Promise<void>;
  rmdir(subpath: string, opts?: { recursive: boolean }): Promise<void>;
  readdir(subpath: string): Promise<DirectoryEntry[]>;
  appendFile(subpath: string, data: string): Promise<void>;
  exec(
    command: string,
    args?: string[],
    timeout?: number
  ): Promise<{ exitCode: number; stdout: string; stderr: string }>;
}

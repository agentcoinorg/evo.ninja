export interface DirectoryEntry {
  name: string;
  type: "file" | "directory";
}

export interface Workspace {
  writeFileSync(subpath: string, data: string): void;
  readFileSync(subpath: string): string;
  existsSync(subpath: string): boolean;
  renameSync(oldPath: string, newPath: string): void;
  mkdirSync(subpath: string, opts?: { recursive: boolean }): void;
  readdirSync(subpath: string): DirectoryEntry[];
  appendFileSync(subpath: string, data: string): void;
  exec(command: string, args?: string[]): Promise<{ exitCode: number, stdout: string; stderr: string }>;
}

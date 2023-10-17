export interface Workspace {
  writeFileSync(subpath: string, data: string): void;
  readFileSync(subpath: string): string;
  existsSync(subpath: string): boolean;
  renameSync(oldPath: string, newPath: string): void;
  mkdirSync(subpath: string, opts?: { recursive: boolean }): void;
  readdirSync(subpath: string): string[];
  appendFileSync(subpath: string, data: string): void;
}

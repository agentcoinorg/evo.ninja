export interface Workspace {
  toWorkspacePath(subpath: string): string;
  writeFileSync(subpath: string, data: string): void;
  readFileSync(subpath: string): string;
  existsSync(subpath: string): boolean;
}

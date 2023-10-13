export interface Workspace {
  writeFileSync(subpath: string, data: string): void;
  readFileSync(subpath: string): string;
  existsSync(subpath: string): boolean;
  renameSync(oldPath: string, newPath: string): void;
  mkdirSync(subpath: string): void;
  readdirSync(subpath: string): string[];
  appendFileSync(subpath: string, data: string): void;
  shellExec(command: string, args?: string[]): Promise<{ exitCode: number, stdout: string; stderr: string }>;
}

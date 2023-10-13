declare module "spawn-command" {
  import { ChildProcess } from "child_process";
  export default function spawn(
    command: string,
    options?: Record<string, unknown>
  ): ChildProcess;
}

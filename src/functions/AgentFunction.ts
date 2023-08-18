import { Workspace } from "../workspaces";
import { WrapClient } from "../wrap";

export interface AgentFunction {
  definition: any;
  buildExecutor: (
    globals: Record<string, string>,
    client: WrapClient,
    workspace: Workspace
  ) => (options: any) => Promise<any>;
}

import { Result, ResultErr, ResultOk } from "@polywrap/result";
import { AgentFunction } from ".";
import { Workspace } from "../workspaces";
import { WrapClient } from "../wrap";

export type ExecuteFunc = (
  name: string | undefined,
  args: string | undefined,
  client: WrapClient,
  globals: Record<string, any>,
  workspace: Workspace,
  functions: AgentFunction[],
) => Promise<Result<string, string>>

export const executeFunc: ExecuteFunc = async (
  name: string | undefined,
  args: string | undefined,
  client: WrapClient,
  globals: Record<string, any>,
  workspace: Workspace,
  functions: AgentFunction[],
): Promise<Result<string, string>> => {
  const functionCallSummary = "";

  return ResultOk(functionCallSummary);
}

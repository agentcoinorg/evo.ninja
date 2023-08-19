import { Result, ResultErr, ResultOk } from "@polywrap/result";
import { Workspace } from "../workspaces";
import { WrapClient } from "../wrap";
import { AgentFunction } from ".";
import { trimText, FUNCTION_NOT_FOUND, UNDEFINED_FUNCTION_ARGS, UNDEFINED_FUNCTION_NAME, UNPARSABLE_FUNCTION_ARGS } from "..";

export type ExecuteFunc = (
  name: string | undefined,
  args: string | undefined,
  client: WrapClient,
  globals: Record<string, any>,
  workspace: Workspace,
  functions: AgentFunction[],
) => Promise<Result<string, string>>;

export const executeFunc: ExecuteFunc = async (
  name: string | undefined,
  args: string | undefined,
  client: WrapClient,
  globals: Record<string, any>,
  workspace: Workspace,
  functions: AgentFunction[],
): Promise<Result<string, string>> => {
  if (!name) {
    return ResultErr(UNDEFINED_FUNCTION_NAME);
  }

  const func = functions.find((f) => f.definition.name === name);
  if (!func) {
    return ResultErr(FUNCTION_NOT_FOUND(name));
  }

  if (!args) {
    return ResultErr(UNDEFINED_FUNCTION_ARGS(name));
  }

  let fnArgs;
  try {
    fnArgs = args
      ? JSON.parse(args)
      : undefined;
  } catch(err: any) {
    return ResultErr(UNPARSABLE_FUNCTION_ARGS(name, args, err));
  }

  const argsStr = JSON.stringify(fnArgs, null, 2);
  let functionCallSummary = `Function call: \`${name}(${argsStr})\`\n`;
  
  const executor = func.buildExecutor(globals, client, workspace);

  const response = await executor(fnArgs);

  // If the function call was unsuccessful
  if (!response.ok) {
    return ResultErr(`The function '${name}' failed, this is the error:\n----------\n` +
    `${response.error && typeof response.error === "string"
      ? trimText(response.error, 300)
      : "Unknown error."}\nJSON Arguments: ${args}\n----------\\n`
    );
  }
  // const resultStr = JSON.stringify(response.result, null, 2);
  if (name === "executeScript" || name === "eval") {
    functionCallSummary += `Result stored into global var: \`{{${fnArgs.result}}}\`. Preview: \`${trimText(response.result, 200)}\`\n`;
  } else if (name === "readVar") {
    functionCallSummary += `Global var '{{${fnArgs.name}}}': Preview: \`${trimText(response.result, 200)}\`\n`;
  } else {
    functionCallSummary += `Result: \`${response.result}\`\n`;
  }

  return ResultOk(functionCallSummary);
}

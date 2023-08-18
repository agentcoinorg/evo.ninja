import { Result, ResultErr, ResultOk } from "@polywrap/result";
import { Workspace } from "../workspaces";
import { WrapClient } from "../wrap";
import { AgentFunction } from ".";

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
  if (!name) {
    return ResultErr("Function call name was undefined.");
  }

  const func = functions.find((f) => f.definition.name === name);
  if (!func) {
    return ResultErr(`Function ${name} does not exist. Try calling executeOperation instead`);
  }

  const executor = func.buildExecutor(globals, client, workspace);

  let fnArgs;
  try {
    fnArgs = args
      ? JSON.parse(args)
      : undefined;
  } catch(err: any) {
    return ResultErr(`Could not parse JSON arguments for function: ${name}. Error: ${err.toString()}\nJSON Arguments: ${args}\nTry using different arguments instead.`);
  }

  // The function call succeeded, record the results
  const argsStr = JSON.stringify(fnArgs, null, 2);
  let functionCallSummary = `Function call: \`${name}(${argsStr})\`\n`;
  
  const response = await executor(fnArgs);

  // If the function call was unsuccessful
  if (!response.ok) {
    return ResultErr(`The function '${name}' failed, this is the error:\n----------\n${response.error && response.error.slice ? response.error.slice(0, 300) + "...": "Unknown error."}\nJSON Arguments: ${args}\n----------\\n`);
  }
  // const resultStr = JSON.stringify(response.result, null, 2);
  if (name === "executeOperation" || name === "eval") {
    functionCallSummary += `Result stored into global var: \`{{${fnArgs.result}}}\`. Preview: \`${
      response.result 
        ? response.result.slice(0, 200) + "..."
        : "undefined"
    }\`\n`;
  } else if (name === "readVar") {
    functionCallSummary += `Global var '{{${fnArgs.name}}}': Preview: \`${
      response.result 
        ? response.result.slice(0, 200) + "..."
        : "undefined"
    }\`\n`;
  } else {
    functionCallSummary += `Result: \`${response.result}\`\n`;
  }

  return ResultOk(functionCallSummary);
}

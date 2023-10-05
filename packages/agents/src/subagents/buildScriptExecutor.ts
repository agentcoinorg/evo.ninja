
import {
  AgentFunctionResult,
  JsEngine,
  JsEngine_GlobalVar,
  shimCode
} from "@evo-ninja/agent-utils";
import { SubAgentContext } from "./SubAgent";

interface BuildScriptExecutorArgs<TAgentContext> {
  context: TAgentContext
  scriptName: string;
  onSuccess: (params: any, result?: string) => AgentFunctionResult;
  onFailure: (params: any, error: string) => AgentFunctionResult;
}

export const buildScriptExecutor = <TAgentContext extends SubAgentContext = SubAgentContext>(
  args: BuildScriptExecutorArgs<TAgentContext>
) => {
  return async (params: any): Promise<AgentFunctionResult> => {
    const { context, scriptName, onSuccess, onFailure } = args;
    const script = context.scripts.getScriptByName(scriptName);

    if (!script) {
      return onFailure(params, `Unable to find the script ${scriptName}`);
    }

    const globals: JsEngine_GlobalVar[] = Object.entries(params).map(
      (entry) => ({
        name: entry[0],
        value: JSON.stringify(entry[1])
      })
    );
    const jsEngine = new JsEngine(args.context.client);
    const result = await jsEngine.evalWithGlobals({
      src: shimCode(script.code),
      globals
    });

    if (result.ok) {
      if (result.value.error == null) {
        const jsPromiseOutput = context.client.jsPromiseOutput;
        if (jsPromiseOutput.ok) {
          return onSuccess(params, JSON.stringify(jsPromiseOutput.value)
          );
        } else {
          return onFailure(params, jsPromiseOutput.error.toString())
        }
      } else {
        return onFailure(params, result.value.error.toString())
      }
    } else {
      return onFailure(params, result.error?.toString() ?? "Unknown error")
    }
  };
}
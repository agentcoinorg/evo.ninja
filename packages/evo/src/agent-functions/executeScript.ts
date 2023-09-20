import JSON5 from "json5";
import { ResultErr, ResultOk } from "@polywrap/result";
import { AgentFunction, AgentFunctionResult, BasicAgentMessage } from "@evo-ninja/agent-utils";
import { AgentContext } from "../AgentContext";
import { EXECUTE_SCRIPT_OUTPUT, FUNCTION_CALL_FAILED } from "../prompts";
import { JsEngine_GlobalVar, JsEngine, shimCode } from "../wrap";

const FN_NAME = "executeScript";

const INVALID_EXECUTE_SCRIPT_ARGS = (
  params: FuncParameters
) => `Invalid arguments provided for script ${params.namespace}: '${params.arguments ?? ""}' is not valid JSON!`;
const SCRIPT_NOT_FOUND = (params: FuncParameters) => `Script '${params.namespace}' not found!`;

type FuncParameters = { 
  namespace: string, 
  description: string, 
  arguments: string,
  result: string
};

export const executeScript: AgentFunction<AgentContext> = {
  definition: {
    name: FN_NAME,
    description: `Execute an script.`,
    parameters: {
      type: "object",
      properties: {
        namespace: {
          type: "string",
          description: "Namespace of the script to execute"
        },
        arguments: {
          type: "string",
          description: "The arguments to pass into the script being executed",
        },
        result: {
          type: "string",
          description: "The name of the variable to store the result of the script"
        }
      },
      required: ["namespace", "arguments", "result"],
      additionalProperties: false
    },
  },
  buildExecutor(context: AgentContext) {
    return async (params: FuncParameters): Promise<AgentFunctionResult> => {
      try {
        const script = context.scripts.getScriptByName(params.namespace);

        if (!script) {
          return error(params.namespace, SCRIPT_NOT_FOUND(params), params);
        }

        let args: any = undefined;
        args = params.arguments ? params.arguments.replace(/\{\{/g, "\\{\\{").replace(/\}\}/g, "\\}\\}") : "{}";
        try {

          args = JSON5.parse(params.arguments);

          if (args) {
            const replaceVars = (str: string, vars: any) => {
              return str.replace(/{{(.*?)}}/g, (match, key) => {
                return vars[key.trim()] || match;  // if the key doesn't exist in vars, keep the original match
              });
            }
            for (const key of Object.keys(args)) {
              if (typeof args[key] === "string") {
                args[key] = replaceVars(
                  args[key],
                  Object.keys(context.globals).reduce(
                    (a, b) => ({ [b]: JSON.parse(context.globals[b]), ...a}), {}
                  )
                );
              }
            }
          }
        } catch {
          return error(params.namespace, INVALID_EXECUTE_SCRIPT_ARGS(params), params);
        }

        const globals: JsEngine_GlobalVar[] =
          Object.entries(args).concat(Object.entries(context.globals))
            .map((entry) => ({
              name: entry[0],
              value: JSON.stringify(entry[1]),
            })
          );

        const jsEngine = new JsEngine(context.client);
        const result = await jsEngine.evalWithGlobals({
          src: shimCode(script.code),
          globals
        });

        if (result.ok && context.client.jsPromiseOutput.ok) {
          context.globals[params.result] =
            JSON.stringify(context.client.jsPromiseOutput.value);
        }

        return result.ok
          ? result.value.error == null
            ? context.client.jsPromiseOutput.ok
              ? ok(params.namespace, context.client.jsPromiseOutput.value, params)
              : ok(params.namespace, context.client.jsPromiseOutput.error, params)
            : error(params.namespace, result.value.error, params)
          : error(params.namespace, result.error?.toString() ?? "Unknown error", params);
      
      } catch (e: any) {
        return ResultErr(e);
      }
    };
  }
};

const ok = (scriptName: string, result: any, params: any): AgentFunctionResult => {
  const argsStr = JSON.stringify(params, null, 2);

  return ResultOk([
    BasicAgentMessage.ok(
      "system",
      `Executed '${scriptName}' script.`,
      `# Function Call:\n\`\`\`javascript\n${FN_NAME}(${argsStr})\n\`\`\`\n` +
      EXECUTE_SCRIPT_OUTPUT(params.result, result)
    )
  ]);
};

const error = (scriptName: string, content: string | undefined, params: any): AgentFunctionResult => {
  return ResultOk([
    BasicAgentMessage.error("system", `'${scriptName}' script failed to execute!`, 
    FUNCTION_CALL_FAILED(FN_NAME, content ?? "Unknown error", params))
  ]);
};

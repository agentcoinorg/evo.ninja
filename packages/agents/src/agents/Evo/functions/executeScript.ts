import { AgentFunctionResult, AgentOutputType, ChatMessageBuilder, JsEngine, JsEngine_GlobalVar, shimCode, trimText } from "@evo-ninja/agent-utils";
import JSON5 from "json5";
import { Result, ResultOk, ResultErr } from "@polywrap/result";
import { FUNCTION_CALL_SUCCESS_CONTENT, FUNCTION_CALL_FAILED } from "../utils";
import { AgentFunction } from "../../..";
import { EvoContext } from "../config";

export const EXECUTE_SCRIPT_FN_NAME = "executeScript";
type EXECUTE_SCRIPT_FN_PARAMS = { 
  namespace: string, 
  description: string, 
  arguments: string,
  variable?: string
}
const EXECUTE_SCRIPT_SUCCESS = (scriptName: string, result: any, params: EXECUTE_SCRIPT_FN_PARAMS): AgentFunctionResult => ({
  outputs: [
    {
      type: AgentOutputType.Success,
      title: `Executed '${scriptName}' script.`,
      content: FUNCTION_CALL_SUCCESS_CONTENT(
        EXECUTE_SCRIPT_FN_NAME,
        params,
        EXECUTE_SCRIPT_OUTPUT(params.variable, result),
      )
    }
  ],
  messages: [
    ChatMessageBuilder.functionCall(EXECUTE_SCRIPT_FN_NAME, params),
    ChatMessageBuilder.functionCallResult(
      EXECUTE_SCRIPT_FN_NAME,
      EXECUTE_SCRIPT_OUTPUT(params.variable, result)
    ),
  ]
});

export const executeScriptFunction: {
  definition: AgentFunction;
  buildExecutor: (context: EvoContext) => (params: EXECUTE_SCRIPT_FN_PARAMS) => Promise<Result<AgentFunctionResult, string>>;
} = {
  definition: {
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
          description: "JSON-formatted arguments to pass into the script being executed. You can replace a value with a global variable by using {{varName}} syntax.",
        },
        variable: {
          type: "string",
          description: "The name of a variable to store the script's result in"
        }
      },
      required: ["namespace", "arguments", "result"],
      additionalProperties: false
    },
  },
  buildExecutor(context: EvoContext) {
    return async (params: EXECUTE_SCRIPT_FN_PARAMS): Promise<Result<AgentFunctionResult, string>> => {
      try {
        const script = context.scripts.getScriptByName(params.namespace);

        if (!script) {
          return ResultOk(EXECUTE_SCRIPT_ERROR_RESULT(params.namespace, SCRIPT_NOT_FOUND(params), params));
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
          return ResultOk(EXECUTE_SCRIPT_ERROR_RESULT(params.namespace, INVALID_EXECUTE_SCRIPT_ARGS(params), params));
        }

        const globals: JsEngine_GlobalVar[] =
          Object.entries(args).map((entry) => ({
              name: entry[0],
              value: JSON.stringify(entry[1]),
            })
          );

        const jsEngine = new JsEngine(context.client);

        const result = await jsEngine.evalWithGlobals({
          src: shimCode(script.code),
          globals
        });

        if (params.variable && result.ok && context.client.jsPromiseOutput.ok) {
          context.globals[params.variable] =
            JSON.stringify(context.client.jsPromiseOutput.value);
        }

        return result.ok
          ? result.value.error == null
            ? context.client.jsPromiseOutput.ok
              ? ResultOk(EXECUTE_SCRIPT_SUCCESS(params.namespace, context.client.jsPromiseOutput.value, params))
              : ResultOk(EXECUTE_SCRIPT_ERROR_RESULT(params.namespace, JSON.stringify(context.client.jsPromiseOutput.error), params))
            : ResultOk(EXECUTE_SCRIPT_ERROR_RESULT(params.namespace, result.value.error, params))
          : ResultOk(EXECUTE_SCRIPT_ERROR_RESULT(params.namespace, result.error?.toString(), params));
      
      } catch (e: any) {
        return ResultErr(e);
      }
    };
  }
}

const EXECUTE_SCRIPT_ERROR_RESULT = (scriptName: string, error: string | undefined, params: EXECUTE_SCRIPT_FN_PARAMS): AgentFunctionResult => ({
  outputs: [
    {
      type: AgentOutputType.Error,
      title: `'${scriptName}' script failed to execute!`,
      content: FUNCTION_CALL_FAILED(params, EXECUTE_SCRIPT_FN_NAME, error ?? "Unknown error"),
    }
  ],
  messages: [
    ChatMessageBuilder.functionCall(EXECUTE_SCRIPT_FN_NAME, params),
    ChatMessageBuilder.functionCallResult(
      EXECUTE_SCRIPT_FN_NAME,
      `Error executing script '${scriptName}'\n` + 
      `\`\`\`\n` +
      `${
        error && typeof error === "string"
          ? trimText(error, 300)
          : error 
            ? trimText(JSON.stringify(error, null, 2), 300)
            : "Unknown error"
        }\n` +
      `\`\`\``
    ),
  ]
});

const INVALID_EXECUTE_SCRIPT_ARGS = (
  params: EXECUTE_SCRIPT_FN_PARAMS
) => `Invalid arguments provided for script ${params.namespace}: '${params.arguments ?? ""}' is not valid JSON!`;
const SCRIPT_NOT_FOUND = (params: EXECUTE_SCRIPT_FN_PARAMS) => `Script '${params.namespace}' not found!`;
const EXECUTE_SCRIPT_OUTPUT = (varName: string | undefined, result: string | undefined) => {
  if (!result || result === "undefined" || result === "\"undefined\"") {
    return `No result returned.`;
  } else if (result.length > 3000) {
    return `Preview of JSON result:\n` + 
          `\`\`\`\n` + 
          `${trimText(result, 3000)}\n` + 
          `\`\`\`\n` + 
          `${STORED_RESULT_IN_VAR(varName)}`;
  } else {
    return `JSON result: \n\`\`\`\n${result}\n\`\`\`\n${STORED_RESULT_IN_VAR(varName)}`;
  }
};
const STORED_RESULT_IN_VAR = (varName: string | undefined) => {
  if (varName && varName.length > 0) {
    return `Result stored in variable: {{${varName}}}`;
  } else {
    return "";
  }
}
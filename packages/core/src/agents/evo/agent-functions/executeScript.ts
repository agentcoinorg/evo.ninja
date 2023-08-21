import { AgentFunction, AgentContext } from "../../agent-function";
import {
  JsEngine_GlobalVar,
  JsEngine_Module,
  shimCode
} from "../../../wrap";

export const executeScript: AgentFunction = {
  definition: {
    name: "executeScript",
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
      required: ["name", "arguments", "result"],
      additionalProperties: false
    },
  },
  buildExecutor: (
    context: AgentContext
  ) => {
    return async (options: { namespace: string, arguments: any, result: string }) => {
      try {
        const script = context.scripts.getScriptByName(options.namespace);

        if (!script) {
          return {
            ok: false,
            error: `Script ${options.namespace} not found.`,
          };
        }

        let args: any = undefined;
        args = options.arguments.replace(/\{\{/g, "\\{\\{").replace(/\}\}/g, "\\}\\}");
        try {

          args = JSON.parse(options.arguments);

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
          return {
            ok: false,
            error: `Invalid arguments provided for script ${options.namespace}: '${options.arguments}' is not valid JSON!`,
          };
        }

        const globals: JsEngine_GlobalVar[] =
          Object.entries(args).concat(Object.entries(context.globals))
            .map((entry) => ({
              name: entry[0],
              value: JSON.stringify(entry[1]),
            })
          );

        const result = await JsEngine_Module.evalWithGlobals({
          src: shimCode(script.code),
          globals
        }, context.client);

        if (result.ok && context.client.jsPromiseOutput.result) {
          context.globals[options.result] =
            JSON.stringify(context.client.jsPromiseOutput.result);
        }

        return result.ok
          ? result.value.error == null
            ? context.client.jsPromiseOutput.result
              ? {
                ok: true,
                result: JSON.stringify(context.client.jsPromiseOutput.result),
              }
              : {
                ok: false,
                error: "No result returned from script.",
              }
            : {
              ok: false,
              error: result.value.error + "\nCode: " + script.code,
             }
          : {
            ok: false,
            error: result.error?.toString() ?? "",
          };
      } catch (e: any) {
        return {
          ok: false,
          error: e,
        };
      }
    };
  }
};

import { AgentFunction } from "../../agent-function";
import {
  WrapClient,
  JsEngine_GlobalVar,
  JsEngine_Module,
  shimCode
} from "../../../wrap";
import { getScriptByName } from "../../../scripts";

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
    externGlobals: Record<string, string>,
    client: WrapClient
  ) => {
    return async (options: { namespace: string, arguments: any, result: string }) => {
      try {
        // if (!options.arguments) {
        //   return {
        //     ok: false,
        //     error: `No arguments provided for script ${options.name}.`,
        //   };
        // }

        const script = getScriptByName(options.namespace);

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
                args[key] = replaceVars(args[key], Object.keys(externGlobals).reduce((a, b) => ({ [b]: JSON.parse(externGlobals[b]), ...a}), {}));
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
          Object.entries(args).concat(Object.entries(externGlobals))
            .map((entry) => ({
              name: entry[0],
              value: JSON.stringify(entry[1]),
            })
          );

        const result = await JsEngine_Module.evalWithGlobals({
          src: shimCode(script.code),
          globals
        }, client);

        if (result.ok && client.jsPromiseOutput.result) {
          externGlobals[options.result] = JSON.stringify(client.jsPromiseOutput.result);
        }

        return result.ok
          ? result.value.error == null
            ? client.jsPromiseOutput.result
              ? {
                ok: true,
                result: JSON.stringify(client.jsPromiseOutput.result),
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

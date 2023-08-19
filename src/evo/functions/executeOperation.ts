import { AgentFunction, WrapClient, functionCodeWrapper, nodeShims } from "../..";
import { JS_ENGINE_URI } from "../../constants";
import { getOperationByName } from "../../operations";

export const executeOperation: AgentFunction = {
  definition: {
    name: "executeOperation",
    description: `Execute an operation.`,
    parameters: {
      type: "object",
      properties: {
        namespace: {
          type: "string",
          description: "Namespace of the operation to execute"
        },
        arguments: {
          type: "string",
          description: "The arguments to pass into the operation being executed.",
        },
        result: {
          type: "string",
          description: "The name of the variable to store the result of the operation"
        }
      },
      required: ["name", "arguments", "result"],
      additionalProperties: false
    },
  },
  buildExecutor: (
    globals: Record<string, string>,
    client: WrapClient
  ) => {
    return async (options: { namespace: string, arguments: any, result: string }) => {
      try {
        // if (!options.arguments) {
        //   return {
        //     ok: false,
        //     error: `No arguments provided for operation ${options.name}.`,
        //   };
        // }
      
        const operation = getOperationByName(options.namespace);
  
        if (!operation) {
          return {
            ok: false,
            error: `Operation ${options.namespace} not found.`,
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
                args[key] = replaceVars(args[key], Object.keys(globals).reduce((a, b) => ({ [b]: JSON.parse(globals[b]), ...a}), {}));
              }
            }
          }
        } catch {
          return {
            ok: false,
            error: `Invalid arguments provided for operation ${options.namespace}: '${options.arguments}' is not valid JSON!`,
          };
        }

        const invokeArgs = {
          src: nodeShims + functionCodeWrapper(operation.code),
          globals: Object.keys(args).map((key) => ({
            name: key,
            value: JSON.stringify(args[key]),
          })).concat(Object.keys(globals).map((key) => ({ name: key, value: globals[key]}))),
        };
  
        const result = await client.invoke<{value: string | undefined, error: string | undefined}>({ 
          uri: JS_ENGINE_URI,
          method: "evalWithGlobals",
          args: invokeArgs,
        });

        console.log("----------------");
        console.log("Execute operation output", client.jsPromiseOutput);
        console.log("----------------");

        if (result.ok && client.jsPromiseOutput.result) {
          globals[options.result] = JSON.stringify(client.jsPromiseOutput.result);
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
                error: "No result returned from operation.",
              }
            : {
              ok: false,
              error: result.value.error + "\nCode: " + operation.code,
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

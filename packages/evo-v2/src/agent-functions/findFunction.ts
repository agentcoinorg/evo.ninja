import JSON5 from "json5";
import { ResultErr, ResultOk } from "@polywrap/result";
import { AgentFunction, AgentFunctionResult, AgentChatMessage } from "@evo-ninja/agent-utils";
import { AgentContext } from "../AgentContext";
import { OTHER_EXECUTE_FUNCTION_OUTPUT, FUNCTION_CALL_FAILED, EXECUTE_SCRIPT_OUTPUT } from "../prompts";
import { Script } from "../Scripts";
import { JsEngine_GlobalVar, JsEngine_Module, shimCode } from "../wrap";

const FN_NAME = "findFunction";

export const findFunction: AgentFunction<AgentContext> = {
  definition: {
    name: "findFunction",
    description: `Search for an function.`,
    parameters: {
      type: "object",
      properties: {
        namespace: {
          type: "string",
          description: "Partial or full namespace of the function"
        },
        description: {
          type: "string",
          description: "The detailed description of the arguments and output of the function."
        },
      },
      required: ["namespace", "description"],
      additionalProperties: false
    },
  },
  buildChatMessage(args: any, result: AgentFunctionResult): AgentChatMessage {
    const argsStr = JSON.stringify(args, null, 2);

    return result.ok
      ? {
          type: "success",
          title: `Searched for '${args.namespace}' function ("${args.description}")`,
          content: 
            `# Function Call:\n\`\`\`javascript\n${FN_NAME}(${argsStr})\n\`\`\`\n` +
            OTHER_EXECUTE_FUNCTION_OUTPUT(result.value),
        }
      : {
          type: "error",
          title: `Failed to search for '${args.namespace}' function!`,
          content: FUNCTION_CALL_FAILED(FN_NAME, result.error, args),
        };
  },
  buildExecutor(context: AgentContext) {
    return async (options: { namespace: string, description: string }): Promise<AgentFunctionResult> => {
      const candidates = context.scripts.searchScripts(
        `${options.namespace} ${options.description}`
      ).slice(0, 5);

      if (candidates.length === 0) {
        return ResultOk(`Found no candidates for function ${options.namespace}. Try creating the function instead.`);
      }

      context.functions.push(...candidates.map((x) => buildFunction(x)));

      return ResultOk(
        `Found the following candidates for function: ${options.namespace}:` + 
        `\n--------------\n` + 
        `${candidates.map((c) => `Namespace: ${c.name}\nArguments: ${c.arguments}\nDescription: ${c.description}`).join("\n--------------\n")}` +
        `\n--------------\n`
      );
    };
  }
};

const buildFunction = (script: Script): AgentFunction<AgentContext> => {
  console.log("SCRIPT", script);
  return {
    definition: {
      //replace . with _
      name: script.name.replace(/\./g, "_"),
      description: script.description,
      parameters: {
        type: "object",
        properties: JSON5.parse(script.arguments),
        required: [],
        additionalProperties: false
      },
    },
    buildChatMessage(args: any, result: AgentFunctionResult): AgentChatMessage {
      console.log("ARGUMMMENTS", args);

      const argsStr = JSON.stringify(args, null, 2);
  
      return result.ok
        ? {
            type: "success",
            title: `Executed '${args.namespace}' function.`,
            content: 
              `# Function Call:\n\`\`\`javascript\n${FN_NAME}(${argsStr})\n\`\`\`\n` +
              EXECUTE_SCRIPT_OUTPUT(args.result, result.value),
          }
        : {
            type: "error",
            title: `'${args.namespace}' function failed to execute!`,
            content: FUNCTION_CALL_FAILED(FN_NAME, result.error, args),
          };
    },
    buildExecutor(context: AgentContext) {
      return async (options: any): Promise<AgentFunctionResult> => {
        console.log("ssss", options);
        try {
          let args: any = undefined;
  
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
  
          if (result.ok && context.client.jsPromiseOutput.ok) {
            context.globals[options.result] =
              JSON.stringify(context.client.jsPromiseOutput.value);
          }
  
          return result.ok
            ? result.value.error == null
              ? context.client.jsPromiseOutput.ok
                ? ResultOk(JSON.stringify(context.client.jsPromiseOutput.value))
                : ResultErr(JSON.stringify(context.client.jsPromiseOutput.error))
              : ResultErr(result.value.error)
            : ResultErr(result.error?.toString() ?? "");
        } catch (e: any) {
          return ResultErr(e);
        }
      };
    }
  };
};
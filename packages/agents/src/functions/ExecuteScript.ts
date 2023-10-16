import { Agent, AgentFunctionResult, AgentOutputType, AgentVariables, ChatMessageBuilder, JsEngine, JsEngine_GlobalVar, Scripts, WrapClient, shimCode, trimText } from "@evo-ninja/agent-utils";
import JSON5 from "json5";
import { AgentFunctionBase } from "../AgentFunctionBase";
import { FUNCTION_CALL_FAILED, FUNCTION_CALL_SUCCESS_CONTENT } from "../agents/Scripter/utils";
import { AgentBaseContext } from "../AgentBase";

interface ExecuteScriptFuncParameters { 
  namespace: string;
  arguments: string;
}

export class ExecuteScriptFunction extends AgentFunctionBase<ExecuteScriptFuncParameters> {
  constructor(private client: WrapClient, private scripts: Scripts) {
    super();
  }

  get name(): string {
    return "executeScript";
  }

  get description(): string {
    return `Execute an script.`;
  }

  get parameters() {
    return {
      type: "object",
      properties: {
        namespace: {
          type: "string",
          description: "Namespace of the script to execute"
        },
        arguments: {
          type: "string",
          description: "JSON-formatted arguments to pass into the script being executed.",
        }
      },
      required: ["namespace", "arguments"],
      additionalProperties: false
    }
  }

  buildExecutor(agent: Agent<unknown>, context: AgentBaseContext): (params: ExecuteScriptFuncParameters, rawParams?: string) => Promise<AgentFunctionResult> {
    return async (params: ExecuteScriptFuncParameters, rawParams?: string): Promise<AgentFunctionResult> => {
      try {
        const script = this.scripts.getScriptByName(params.namespace);

        if (!script) {
          return this.onError(params.namespace, this.scriptNotFound(params), params, rawParams, context.variables);
        }

        let args: unknown;
        args = params.arguments ? params.arguments.replace(/\{\{/g, "\\{\\{").replace(/\}\}/g, "\\}\\}") : "{}";
        try {
          args = JSON5.parse(params.arguments);

          if (typeof args !== "object") {
            throw "Args must be an object.";
          }

          if (args) {
            for (const [key, value] of Object.entries(args)) {
              if (typeof value === "string" && AgentVariables.hasSyntax(value)) {
                (args as Record<string, unknown>)[key] = context.variables.get(value);
              }
            }
          }
        } catch {
          return this.onError(params.namespace, this.invalidExecuteScriptArgs(params), params, rawParams, context.variables);
        }

        const globals: JsEngine_GlobalVar[] =
          Object.entries(args as Record<string, unknown>).map((entry) => ({
              name: entry[0],
              value: JSON.stringify(entry[1]),
            })
          );

        const jsEngine = new JsEngine(this.client);

        const result = await jsEngine.evalWithGlobals({
          src: shimCode(script.code),
          globals
        });

        return result.ok
          ? result.value.error == null
            ? this.client.jsPromiseOutput.ok
              ? this.onSuccess(params.namespace, this.client.jsPromiseOutput.value, params, rawParams, context.variables)
              : this.onError(params.namespace, JSON.stringify(this.client.jsPromiseOutput.error), params, rawParams, context.variables)
            : this.onError(params.namespace, result.value.error, params, rawParams, context.variables)
          : this.onError(params.namespace, result.error?.toString(), params, rawParams, context.variables);
      } catch (e: any) {
        return this.onError(params.namespace, e.toString(), params, rawParams, context.variables);
      }
    };
  }

  private onSuccess(scriptName: string, result: any, params: ExecuteScriptFuncParameters, rawParams: string | undefined, variables: AgentVariables): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `Executed '${scriptName}' script.`,
          content: FUNCTION_CALL_SUCCESS_CONTENT(
            this.name,
            params,
            result,
          )
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ...ChatMessageBuilder.functionCallResultWithVariables(
          this.name,
          result,
          variables
        ),
      ]
    }
  }

  private onError(scriptName: string, error: string | undefined, params: ExecuteScriptFuncParameters, rawParams: string | undefined, variables: AgentVariables) {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `'${scriptName}' script failed to execute!`,
          content: FUNCTION_CALL_FAILED(params, this.name, error ?? "Unknown error"),
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ...ChatMessageBuilder.functionCallResultWithVariables(
          this.name,
          `Error executing script '${scriptName}'\n` + 
          `\`\`\`\n` +
          `${
            error && typeof error === "string"
              ? trimText(error, 300)
              : error 
                ? trimText(JSON.stringify(error, null, 2), 300)
                : "Unknown error"
            }\n` +
          `\`\`\``,
          variables
        ),
      ]
    }
  }

  private invalidExecuteScriptArgs(params: ExecuteScriptFuncParameters) {
    return `Invalid arguments provided for script ${params.namespace}: '${params.arguments ?? ""}' is not valid JSON!`;
  }

  private scriptNotFound(params: ExecuteScriptFuncParameters) {
    return `Script '${params.namespace}' not found!`;
  }
}

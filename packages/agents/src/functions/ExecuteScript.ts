import { Agent, AgentFunctionResult, AgentOutputType, AgentVariables, ChatMessageBuilder, JsEngine, JsEngine_GlobalVar, Scripts, WrapClient, shimCode, trimText } from "@evo-ninja/agent-utils";
import JSON5 from "json5";
import { AgentFunctionBase } from "../AgentFunctionBase";
import { FUNCTION_CALL_FAILED, FUNCTION_CALL_SUCCESS_CONTENT } from "../agents/Scripter/utils";
import { AgentBaseContext } from "../AgentBase";

interface ExecuteScriptFuncParameters { 
  namespace: string;
  arguments: string;
  variable?: string;
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
        },
        variable: {
          type: "string",
          description: "The name of a variable to store the script's result in"
        }
      },
      required: ["namespace", "arguments", "variable"],
      additionalProperties: false
    }
  }

  buildExecutor(agent: Agent<unknown>, context: AgentBaseContext): (params: ExecuteScriptFuncParameters, rawParams: string | undefined) => Promise<AgentFunctionResult> {
    return async (params: ExecuteScriptFuncParameters, rawParams: string | undefined): Promise<AgentFunctionResult> => {
      try {
        const script = this.scripts.getScriptByName(params.namespace);

        if (!script) {
          return this.onError(params.namespace, this.scriptNotFound(params), params, rawParams, context.variables);
        }

        let args: any;
        args = params.arguments ? params.arguments.replace(/\{\{/g, "\\{\\{").replace(/\}\}/g, "\\}\\}") : "{}";
        try {

          args = JSON5.parse(params.arguments);

          if (args) {
            for (const key of Object.keys(args)) {
              if (typeof args[key] === "string" && AgentVariables.hasSyntax(args[key])) {
                args[key] = context.variables.get(args[key]);
              }
            }
          }
        } catch {
          return this.onError(params.namespace, this.invalidExecuteScriptArgs(params), params, rawParams, context.variables);
        }

        const globals: JsEngine_GlobalVar[] =
          Object.entries(args).map((entry) => ({
              name: entry[0],
              value: JSON.stringify(entry[1]),
            })
          );

        const jsEngine = new JsEngine(this.client);

        const result = await jsEngine.evalWithGlobals({
          src: shimCode(script.code),
          globals
        });

        if (params.variable && result.ok && this.client.jsPromiseOutput.ok) {
          context.variables.set(
            params.variable,
            JSON.stringify(this.client.jsPromiseOutput.value)
          );
        }

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
            this.executeScriptOutput(params.variable, result),
          )
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ChatMessageBuilder.functionCallResult(
          this.name,
          this.executeScriptOutput(params.variable, result),
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
        ChatMessageBuilder.functionCallResult(
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

  private executeScriptOutput(varName: string | undefined, result: string | undefined) {
    if (!result || result === "undefined" || result === "\"undefined\"") {
      return `No result returned.`;
    } else if (result.length > 3000) {
      return `Preview of JSON result:\n` + 
            `\`\`\`\n` + 
            `${trimText(result, 3000)}\n` + 
            `\`\`\`\n` + 
            `${this.storedResultInVar(varName)}`;
    } else {
      return `JSON result: \n\`\`\`\n${result}\n\`\`\`\n${this.storedResultInVar(varName)}`;
    }
  }

  private storedResultInVar(varName: string | undefined) {
    if (varName && varName.length > 0) {
      return `Result stored in variable: \${${varName}}`;
    } else {
      return "";
    }
  }
}

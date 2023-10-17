import {
  Agent,
  AgentFunctionResult,
  AgentOutputType,
  AgentVariables, ChatLogs,
  ChatMessageBuilder, LlmApi, Tokenizer,
  trimText
} from "@evo-ninja/agent-utils";
import {AgentFunctionBase} from "../AgentFunctionBase";
import {AgentBaseContext} from "../AgentBase";
import {FUNCTION_CALL_FAILED} from "../agents/Scripter/utils";

interface ShellExecFuncParameters {
  command: string;
  args: string[];
}

export class ShellExecFunction extends AgentFunctionBase<ShellExecFuncParameters> {

  constructor(private _llm: LlmApi, private _tokenizer: Tokenizer,) {
    super();
  }

  get name() {
    return "cmd_shellExec"
  }

  get description() {
    return "Executes `[command] [args]` in the workspace."
  }

  get parameters() {
    return {
      type: "object",
      properties: {
        command: {
          type: "string",
        },
        args: {
          type: "array",
          items: {
            type: "string"
          }
        },
      },
      required: ["command", "args"],
      additionalProperties: false
    }
  }

  buildExecutor(agent: Agent<unknown>, context: AgentBaseContext): (params: ShellExecFuncParameters, rawParams?: string) => Promise<AgentFunctionResult> {
    return async (params: ShellExecFuncParameters, rawParams?: string): Promise<AgentFunctionResult> => {
      const output = await context.workspace.exec(params.command, params.args);
      const resultSummary = await this.summarizeExecResult(params, JSON.stringify(output));
      if (output.exitCode === 0) {
        return this.onSuccess(resultSummary, params, rawParams, context.variables);
      } else {
        return this.onError(resultSummary, params, rawParams, context.variables);
      }
    };
  }

  private onSuccess(output: string, params: ShellExecFuncParameters, rawParams: string | undefined, variables: AgentVariables): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: `Successfully executed '${params.command} ${params.args.join(" ")}'`,
          content: `${trimText(output, 500)}`
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ChatMessageBuilder.functionCallResult(this.name, output)
      ]
    };
  }

  private onError(output: string, params: ShellExecFuncParameters, rawParams: string | undefined, variables: AgentVariables) {
    return {
      outputs: [
        {
          type: AgentOutputType.Error,
          title: `Failed to execute '${params.command} ${params.args.join(" ")}'`,
          content: FUNCTION_CALL_FAILED(params, this.name, output),
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ChatMessageBuilder.functionCallResult(
          this.name,
          `Error executing shell command '${params.command} ${params.args.join(" ")}'.\n` + output
        ),
      ]
    }
  }

  private async summarizeExecResult(params: ShellExecFuncParameters, output: string): Promise<string> {
    const message = `I executed the shell command \`${params.command} ${params.args.join(" ")}\`. ` +
      `Please concisely summarize the output:\n\n\`\`\`json\n${output}\`\`\``;

    const chatLogs = new ChatLogs({
      persistent: {
        tokens: this._tokenizer.encode(message).length,
        msgs: [
          {
            role: "user",
            content: message,
          },
        ],
      },
      temporary: {
        tokens: 0,
        msgs: [],
      },
    });
    const response = await this._llm.getResponse(chatLogs, undefined);
    return response?.content ?? "No output";
  }
}
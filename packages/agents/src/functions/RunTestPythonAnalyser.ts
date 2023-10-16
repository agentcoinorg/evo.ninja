import {
  Agent,
  AgentFunctionResult,
  WrapClient,
  LlmApi,
  ChatLogs,
  Tokenizer,
  ChatMessageBuilder,
} from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../AgentFunctionBase";
import { AgentBaseContext } from "../AgentBase";

interface FunctionParams {
  filename: string;
  context: string;
}

export class RunTestPythonAnalyser extends AgentFunctionBase<FunctionParams> {
  constructor(
    private _llm: LlmApi,
    private _tokenizer: Tokenizer,
    private client: WrapClient
  ) {
    super();
  }

  get name() {
    return "runPythonTest";
  }

  get description() {
    return `Run python test and analyses error.`;
  }

  get parameters() {
    return {
      type: "object",
      properties: {
        filename: {
          type: "string",
        },
        context: {
          type: "string"
        }
      },
      required: ["filename", "context"],
      additionalProperties: false,
    };
  }

  buildExecutor(_: Agent<unknown>, context: AgentBaseContext) {
    return async (params: FunctionParams, rawParams?: string): Promise<AgentFunctionResult> => {
      const testResult = await this.client.invoke<
        { success: true } | { success: false; error: string }
      >({
        uri: "plugin/cmd",
        method: "runPythonTest",
        args: {
          filename: params.filename,
        },
      });

      if (!testResult.ok) {
        throw new Error(testResult.error?.message);
      }

      if (!testResult.value.success) {
        const message = `Analyze this error from python test and find what must be changed:
\`\`\`
${testResult.value.error}
\`\`\`
        `;
        const chatLogs = new ChatLogs({
          persistent: {
            tokens: this._tokenizer.encode(message).length,
            msgs: [
              {
                role: "user",
                content: message,
              },
              {
                role: "user",
                content: params.context
              }
            ],
          },
          temporary: {
            tokens: 0,
            msgs: [],
          },
        });
        const response = await this._llm.getResponse(chatLogs, undefined)

        return {
          outputs: [],
          messages: [
            ChatMessageBuilder.functionCall(this.name, params),
            ChatMessageBuilder.functionCallResult(this.name, response?.content || "Error could not be diagnosed. Can you please provide more information", context.variables)
          ]
        };
      } else {
        return {
          outputs: [],
          messages: [
            ChatMessageBuilder.functionCall(this.name, params),
            ChatMessageBuilder.functionCallResult(this.name, "Test ran succesfully", context.variables)
          ]
        };
      }
    };
  }
}

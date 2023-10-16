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
  implementationCode: string;
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
        implementationCode: {
          type: "string"
        }
      },
      required: ["filename", "implementationCode"],
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
        const message = `Modify the following implementation code in order to fix the error given:
\`\`\`python
${params.implementationCode}
\`\`\`

Test failed with following error:
\`\`\`
${testResult.value.error}
\`\`\`

Make sure that you are modifying the necessary code so you have an iterative development process.
Return the entire implementation file, rather than just a piece of code; with the following format:
\`\`\`python
# code...
\`\`\`
`;
        const chatLogs = new ChatLogs({
          persistent: {
            tokens: this._tokenizer.encode(message).length,
            msgs: [
              {
                role: "user",
                content: "You are a python software development assistant that helps junior developer to debug problems"
              },
              {
                role: "user",
                content: message,
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
            ChatMessageBuilder.functionCallResult(this.name, response?.content || "Error could not be diagnosed. Can you please provide more information")
          ]
        };
      } else {
        return {
          outputs: [],
          messages: [
            ChatMessageBuilder.functionCall(this.name, params),
            ChatMessageBuilder.functionCallResult(this.name, "Succesfully ran test.")
          ]
        };
      }
    };
  }
}

import {
    Agent,
    AgentFunctionResult,
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
  
  type TestExecutor = Promise<{ success: true } | { success: false, error: string }>
  
  export class RunAndAnalysePythonTestFunction extends AgentFunctionBase<FunctionParams> {
    constructor(
      private _llm: LlmApi,
      private _tokenizer: Tokenizer,
    ) {
      super();
    }
  
    get name() {
      return "runAndAnalysePythonTest";
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
            type: "string",
          },
        },
        required: ["filename", "implementationCode"],
        additionalProperties: false,
      };
    }
  
    buildExecutor(_: Agent<unknown>, context: AgentBaseContext) {
      return async (
        params: FunctionParams,
        rawParams?: string
      ): Promise<AgentFunctionResult> => {
        const testRunner = async (filename: string): TestExecutor => {
          context.logger.notice("CMD.RUN_PYTHON_TEST = " + filename);
          const command = `python ${filename}`;
          const loopGuard = (): TestExecutor =>
            new Promise((_, reject) =>
              setTimeout(() => {
                reject(
                  new Error(
                    "15 seconds timeout reached on test. Maybe you have an infinite loop?"
                  )
                );
              }, 15000)
            );

          const executeTest = async (): TestExecutor => {
            const response = await context.workspace.exec(command);
            if (response.exitCode === 0 && response.stderr.endsWith("OK\n")) {
              return {
                success: true,
              };
            } else {
              return {
                success: false,
                error: response.stderr,
              };
            }
          };
  
          try {
            return await Promise.race([executeTest(), loopGuard()]);
          } catch (e) {
            return {
              success: false,
              error: "Error executing python test: " + e.message,
            };
          }
        };
  
        const testResult = await testRunner(params.filename)
        if (!testResult.success) {
          const message = `Provide what should be modified in the implementation:
  \`\`\`python
  ${params.implementationCode}
  \`\`\`
  
  Based on the received error:
  \`\`\`
  ${testResult.error}
  \`\`\``;
          const chatLogs = new ChatLogs({
            persistent: {
              tokens: this._tokenizer.encode(message).length,
              msgs: [
                {
                  role: "user",
                  content:
                    "You are a python software development assistant that helps junior developer to debug problems",
                },
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
  
          return {
            outputs: [],
            messages: [
              ChatMessageBuilder.functionCall(this.name, params),
              ChatMessageBuilder.functionCallResult(
                this.name,
                response?.content ||
                  "Error could not be diagnosed. Can you please provide more information"
              ),
            ],
          };
        } else {
          return {
            outputs: [],
            messages: [
              ChatMessageBuilder.functionCall(this.name, params),
              ChatMessageBuilder.functionCallResult(
                this.name,
                "Succesfully ran test."
              ),
            ],
          };
        }
      };
    }
  }
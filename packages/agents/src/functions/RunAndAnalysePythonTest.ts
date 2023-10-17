import {
  Agent,
  AgentFunctionResult,
  ChatMessageBuilder,
} from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../AgentFunctionBase";
import { AgentBaseContext } from "../AgentBase";

interface FunctionParams {
  filename: string;
}

type TestExecutor = Promise<
  { success: true } | { success: false; error: string }
>;

export class RunAndAnalysePythonTestFunction extends AgentFunctionBase<FunctionParams> {
  constructor() {
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
      },
      required: ["filename"],
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
            error: e.message,
          };
        }
      };

      const testResult = await testRunner(params.filename);
      if (!testResult.success) {
        return {
          outputs: [],
          messages: [
            ChatMessageBuilder.functionCall(this.name, params),
            ...ChatMessageBuilder.functionCallResultWithVariables(this.name, testResult.error, context.variables)
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

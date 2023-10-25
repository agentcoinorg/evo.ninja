import {
  AgentFunctionResult,
  ChatMessageBuilder,
} from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../AgentFunctionBase";
import { Agent } from "../Agent";

interface RunPytestFuncParams {}

type TestExecutor = Promise<
  { success: true } | { success: false; error: string }
>;

export class RunAndAnalysePythonTestFunction extends AgentFunctionBase<RunPytestFuncParams> {
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
      properties: {},
      required: [],
      additionalProperties: false,
    };
  }

  buildExecutor({ context }: Agent<unknown>) {
    return async (
      params: RunPytestFuncParams,
      rawParams?: string
    ): Promise<AgentFunctionResult> => {
      const testRunner = async (filename: string): TestExecutor => {
        // context.logger.notice("CMD.RUN_PYTHON_TEST = " + filename);
        // const command = `python ${filename}`;
        // const loopGuard = (): TestExecutor =>
        //   new Promise((_, reject) =>
        //     setTimeout(() => {
        //       reject(
        //         new Error(
        //           "15 seconds timeout reached on test. Maybe you have an infinite loop?"
        //         )
        //       );
        //     }, 15000)
        //   );

        // const executeTest = async (): TestExecutor => {
        const runTest = async (): TestExecutor => {
          const response = await context.workspace.exec("pytest");
          const summaryPattern =
            /=========================== short test summary info ============================([\s\S]+?)===========================/;

          if (response.exitCode == 0) {
            return {
              success: true,
            };
          } else {
            const match = summaryPattern.exec(response.stdout);
            if (match) {
              console.log("this is the text: ");
              console.log(match[1]);
              return {
                success: false,
                error: match[1].trim(),
              };
            } else {
              return { success: false, error: "Summary not found." };
            }
          }
        };

        return await runTest();

        // try {
        // return await Promise.race([executeTest(), loopGuard()]);
        // } catch (e) {
        //   return {
        //     success: false,
        //     error: e.message,
        //   };
        // }
      };

      const testResult = await testRunner(params.filename);
      if (!testResult.success) {
        return {
          outputs: [],
          messages: [
            ChatMessageBuilder.functionCall(this.name, params),
            ChatMessageBuilder.functionCallResult(this.name, testResult.error),
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

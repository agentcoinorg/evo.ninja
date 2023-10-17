import { Agent, AgentFunctionResult, AgentOutputType, AgentVariables, ChatMessageBuilder } from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "../AgentFunctionBase";
import { FUNCTION_CALL_SUCCESS_CONTENT } from "../agents/Scripter/utils";
import { AgentBaseContext } from "../AgentBase";

interface InitPoetryFuncParameters {}

export class InitPoetryFunction extends AgentFunctionBase<InitPoetryFuncParameters> {

  get name(): string {
    return "cmd_initPoetry";
  }
  get description(): string {
    return `Initialize a Python Poetry environment in the workspace.`;
  }
  get parameters() {
    return {}
  }

  buildExecutor(agent: Agent<unknown>, context: AgentBaseContext): (params: InitPoetryFuncParameters, rawParams?: string) => Promise<AgentFunctionResult> {
    return async (params: InitPoetryFuncParameters, rawParams?: string): Promise<AgentFunctionResult> => {
      await context.workspace.poetryInit();
      return this.onSuccess(params, rawParams, context.variables);
    };
  }

  private onSuccess(params: InitPoetryFuncParameters, rawParams: string | undefined, variables: AgentVariables): AgentFunctionResult {
    return {
      outputs: [
        {
          type: AgentOutputType.Success,
          title: this.name,
          content: FUNCTION_CALL_SUCCESS_CONTENT(
            this.name,
            params,
            "Initialized Poetry Environment."
          )
        }
      ],
      messages: [
        ChatMessageBuilder.functionCall(this.name, rawParams),
        ...ChatMessageBuilder.functionCallResultWithVariables(
          this.name,
          "Initialized Python Poetry Environment. You can now execute `poetry run [command] [args]` in the shell.",
          variables
        ),
      ]
    }
  }
}

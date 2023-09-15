import { agentFunctions } from "./agent-functions";
import { ResultErr } from "@polywrap/result";
import { IAgent, Workspace } from "@evo-ninja/agent-utils";
import { LlmApi, Chat, Logger, StepOutput, RunResult, executeAgentFunction, basicFunctionCallLoop } from "@evo-ninja/agent-utils";
import { AgentContext } from "./AgentContext";
import { GOAL_PROMPT, INITIAL_PROMP, LOOP_PREVENTION_PROMPT } from "./prompts";

export class ScriptWriter implements IAgent {
  private readonly context: AgentContext;

  constructor(
    llm: LlmApi,
    chat: Chat,
    private readonly logger: Logger,
    public readonly workspace: Workspace,
  ) {
    this.context = {
      llm,
      chat,
      workspace,
    };
  }

  public async* run(
    namespace: string, 
    description: string,
    args: string,
  ): AsyncGenerator<StepOutput, RunResult, string | undefined> {
    const { chat } = this.context;
    try {
      chat.persistent("system", INITIAL_PROMP);
      chat.persistent("system", GOAL_PROMPT(namespace, description, args));

      return yield* basicFunctionCallLoop(
        this.context,
        executeAgentFunction,
        agentFunctions,
        LOOP_PREVENTION_PROMPT
      );
    } catch (err) {
      this.logger.error(err);
      return ResultErr("Unrecoverable error encountered.");
    }
  }
}

import { agentFunctions } from "./agent-functions";
import { writeFunction } from "./agent-functions/writeFunction";
import { AgentContext } from "./AgentContext";
import { GOAL_PROMPT, INITIAL_PROMP, LOOP_PREVENTION_PROMPT } from "./prompts";

import { ResultErr } from "@polywrap/result";
import { Agent, Workspace } from "@evo-ninja/agent-utils";
import { LlmApi, Chat, Logger, AgentOutput, RunResult, basicFunctionCallLoop } from "@evo-ninja/agent-utils";

export class ScriptWriter implements Agent<{
  namespace: string;
  description: string;
  args: string;
}> {
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
    {
      namespace,
      description,
      args,
    }: {
      namespace: string;
      description: string;
      args: string;
    }
  ): AsyncGenerator<AgentOutput, RunResult, string | undefined> {
    const { chat } = this.context;
    try {
      chat.persistent("system", INITIAL_PROMP);
      chat.persistent("user", GOAL_PROMPT(namespace, description, args));

      return yield* basicFunctionCallLoop(
        this.context,
        agentFunctions,
        (functionCalled) => {
          return functionCalled.name === writeFunction.definition.name;
        },
        LOOP_PREVENTION_PROMPT
      );
    } catch (err) {
      this.logger.error(err);
      return ResultErr("Unrecoverable error encountered.");
    }
  }
}

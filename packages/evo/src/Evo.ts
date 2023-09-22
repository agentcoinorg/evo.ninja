import { agentFunctions } from "./agent-functions";
import { agentPlugin } from "./agent-plugin";
import { AgentContext } from "./AgentContext";
import { Scripts } from "./Scripts";
import { WrapClient } from "./wrap";
import {
  INITIAL_PROMP,
  LOOP_PREVENTION_PROMPT
} from "./prompts";

import {
  Agent,
  Workspace,
  LlmApi,
  Chat,
  Logger,
  AgentOutput,
  RunResult,
  Timeout,
  InMemoryWorkspace,
  executeAgentFunction,
  basicFunctionCallLoop
} from "@evo-ninja/agent-utils";
import { ScriptWriter } from "@evo-ninja/js-script-writer-agent";
import { ResultErr } from "@polywrap/result";

export class Evo implements Agent {
  private readonly context: AgentContext;

  constructor(
    private readonly llm: LlmApi,
    private readonly chat: Chat,
    private readonly logger: Logger,
    private readonly workspace: Workspace,
    scripts: Scripts,
    private readonly timeout?: Timeout
  ) {
    this.context = {
      llm,
      chat,
      workspace,
      scripts,
      logger,
      globals: {},
      client: new WrapClient(
        this.workspace,
        this.logger,
        agentPlugin({ logger: this.logger })
      ),
    };
  }

  public async* run(goal: string): AsyncGenerator<AgentOutput, RunResult, string | undefined> {
    const { chat } = this.context;
    const createScriptWriter = (): ScriptWriter => {
      const workspace = new InMemoryWorkspace();
      const chat = new Chat(workspace, this.llm, this.chat.tokenizer, this.logger);
      return new ScriptWriter(this.llm, chat, this.logger, workspace);
    };

    if (this.timeout) {
      setTimeout(this.timeout.callback, this.timeout.milliseconds);
    }

    try {
      chat.persistent("system", INITIAL_PROMP);
      chat.persistent("user", goal);

      return yield* basicFunctionCallLoop(
        this.context,
        executeAgentFunction,
        agentFunctions(createScriptWriter),
        (functionCalled) => {
          const namespace = functionCalled.args.namespace || "";
          const terminationFunctions = [
            `agent.onGoalAchieved`,
            `agent.onGoalFailed`
          ];
          return terminationFunctions.includes(namespace);
        },
        LOOP_PREVENTION_PROMPT
      );
    } catch (err) {
      this.logger.error(err);
      return ResultErr("Unrecoverable error encountered.");
    }
  }
}

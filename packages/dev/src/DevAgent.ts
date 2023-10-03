import { AgentContext } from "./AgentContext";
import { agentFunctions } from "./agent-functions";
import { INITIAL_PROMP, GOAL_PROMPT, LOOP_PREVENTION_PROMPT } from "./prompts";

import {
  Agent,
  AgentOutput,
  Chat,
  RunResult,
  LlmApi,
  Scripts,
  Logger,
  Workspace,
  WrapClient,
  agentPlugin,
  basicFunctionCallLoop,
  ExecuteAgentFunctionCalled
} from "@evo-ninja/agent-utils";
import { ResultErr } from "@polywrap/result";

export class DevAgent implements Agent {
  private readonly context: AgentContext;

  constructor(
    llm: LlmApi,
    chat: Chat,
    workspace: Workspace,
    scripts: Scripts,
    private readonly logger: Logger
  ) {
    this.context = {
      llm,
      chat,
      scripts,
      workspace,
      client: new WrapClient(
        workspace,
        this.logger,
        agentPlugin({ logger: this.logger })
      ),
    };
  }

  public get workspace(): Workspace {
    return this.context.workspace;
  }

  public async* run(
    goal: string
  ): AsyncGenerator<AgentOutput, RunResult, string | undefined> {
    const { chat } = this.context;
    try {
      chat.persistent("system", INITIAL_PROMP());
      chat.persistent("user", GOAL_PROMPT(goal));

      return yield* basicFunctionCallLoop(
        this.context,
        agentFunctions,
        (functionCalled: ExecuteAgentFunctionCalled) => {
          const terminationFunctions = [
            "agent_onGoalAchieved",
            "agent_onGoalFailed"
          ];
          return terminationFunctions.includes(functionCalled.name);
        },
        LOOP_PREVENTION_PROMPT
      );
    } catch (err) {
      this.logger.error(err);
      return ResultErr("Unrecoverable error encountered.");
    }
  }
}

import {
  Chat,
  Scripts,
  WrapClient,
  agentPlugin,
  Timeout,
  basicFunctionCallLoop,
  AgentOutput,
  RunResult,
  AgentVariables,
} from "@evo-ninja/agent-utils";
import { AgentBase, AgentBaseContext } from "../../AgentBase";
import {
  ScriptedAgentOrFactory,
  ScriptedAgentContext,
} from "../../scriptedAgents";
import { DelegateAgentFunction } from "../../functions/DelegateScriptedAgent";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { ResultErr } from "@polywrap/result";
import { VerifyGoalAchievedFunction } from "../../functions/VerifyGoalAchieved";
import { getDefaultDelegatedAgents } from "./getDefaultDelegatedAgents";
import * as prompts from "./prompts";

const AGENT_NAME = "Evo";

export interface EvoRunArgs {
  goal: string
}

export class Evo extends AgentBase<EvoRunArgs, ScriptedAgentContext> {
  constructor(
    context: AgentBaseContext,
    scripts: Scripts,
    timeout?: Timeout,
    delegatedAgents?: ScriptedAgentOrFactory[]
  ) {
    const agentContext: ScriptedAgentContext = {
      ...context,
      scripts,
      variables: new AgentVariables(),
      client: new WrapClient(context.workspace, context.logger, agentPlugin({ logger: context.logger }), context.env),
    };

    const onGoalAchievedFn = new OnGoalAchievedFunction(agentContext.client, agentContext.scripts);
    const onGoalFailedFn = new OnGoalFailedFunction(agentContext.client, agentContext.scripts);
    const verifyGoalAchievedFn = new VerifyGoalAchievedFunction(agentContext.client, agentContext.scripts);

    delegatedAgents = delegatedAgents ?? getDefaultDelegatedAgents(agentContext);

    super(
      {
        name: AGENT_NAME,
        expertise: prompts.EXPERTISE,
        initialMessages: prompts.INITIAL_MESSAGES(verifyGoalAchievedFn, onGoalFailedFn),
        loopPreventionPrompt: prompts.LOOP_PREVENTION_PROMPT,
        functions: [
          onGoalAchievedFn,
          onGoalFailedFn,
          ...delegatedAgents.map((x) => new DelegateAgentFunction(x)),
        ],
        shouldTerminate: (functionCalled) => {
          return [onGoalAchievedFn.name, onGoalFailedFn.name].includes(
            functionCalled.name
          );
        },
        timeout
      },
      agentContext
    );
  }

  public async *runWithChat(args: {
    chat: Chat;
  }): AsyncGenerator<AgentOutput, RunResult, string | undefined> {
    this.context.chat = args.chat;
    if (this.config.timeout) {
      setTimeout(
        this.config.timeout.callback,
        this.config.timeout.milliseconds
      );
    }
    try {
      return yield* basicFunctionCallLoop(
        this.context,
        this.config.functions.map((fn) => {
          return {
            definition: fn.getDefinition(),
            buildExecutor: (context: ScriptedAgentContext) => {
              return fn.buildExecutor(this, context);
            },
          };
        }),
        (functionCalled) => {
          return this.config.shouldTerminate(functionCalled);
        },
        this.config.loopPreventionPrompt,
        this.config.agentSpeakPrompt
      );
    } catch (err) {
      this.context.logger.error(err);
      return ResultErr("Unrecoverable error encountered.");
    }
  }
}

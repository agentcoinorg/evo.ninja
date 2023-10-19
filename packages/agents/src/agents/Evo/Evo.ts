import {
  Chat,
  Timeout,
  basicFunctionCallLoop,
  AgentOutput,
  RunResult,
} from "@evo-ninja/agent-utils";
import { AgentBase, AgentBaseContext } from "../../AgentBase";
import {
  ScriptedAgentOrFactory,
  DataAnalystAgent,
  DeveloperAgent,
  ResearcherAgent,
} from "../../scriptedAgents";
import { DelegateAgentFunction } from "../../functions/DelegateScriptedAgent";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { ResultErr } from "@polywrap/result";
import { VerifyGoalAchievedFunction } from "../../functions/VerifyGoalAchieved";
import { prompts } from "./prompts";
import { ScripterAgent } from "../Scripter";

export interface EvoRunArgs {
  goal: string
}

export class Evo extends AgentBase<EvoRunArgs, AgentBaseContext> {
  constructor(
    context: AgentBaseContext,
    timeout?: Timeout,
    delegatedAgents?: ScriptedAgentOrFactory[]
  ) {
    const onGoalAchievedFn = new OnGoalAchievedFunction(context.scripts);
    const onGoalFailedFn = new OnGoalFailedFunction(context.scripts);
    const verifyGoalAchievedFn = new VerifyGoalAchievedFunction(context.llm, context.chat.tokenizer);

    delegatedAgents = delegatedAgents ?? [
        DeveloperAgent,
        ResearcherAgent,
        DataAnalystAgent,
        ScripterAgent
      ].map(agentClass => () => new agentClass(context.cloneEmpty()));

    super(
      {
        functions: [
          onGoalAchievedFn,
          onGoalFailedFn,
          ...delegatedAgents.map((x) => new DelegateAgentFunction(x, context.llm, context.chat.tokenizer)),
        ],
        shouldTerminate: (functionCalled) => {
          return [onGoalAchievedFn.name, onGoalFailedFn.name].includes(
            functionCalled.name
          );
        },
        prompts: prompts(verifyGoalAchievedFn, onGoalFailedFn),
        timeout
      },
      context
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
            buildExecutor: (context: AgentBaseContext) => {
              return fn.buildExecutor(this, context);
            },
          };
        }),
        (functionCalled) => {
          return this.config.shouldTerminate(functionCalled);
        },
        this.config.prompts.loopPreventionPrompt,
        this.config.prompts.agentSpeakPrompt
      );
    } catch (err) {
      this.context.logger.error(err);
      return ResultErr("Unrecoverable error encountered.");
    }
  }
}

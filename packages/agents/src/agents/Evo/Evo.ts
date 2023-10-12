import {
  LlmApi,
  Chat,
  Workspace,
  Scripts,
  Env,
  WrapClient,
  agentPlugin,
  Logger,
  Timeout,
  basicFunctionCallLoop,
  AgentOutput,
  RunResult,
  AgentVariables,
} from "@evo-ninja/agent-utils";
import { AgentBase, AgentBaseConfig } from "../../AgentBase";
import {
  DataAnalystAgent,
  DeveloperAgent,
  ResearcherAgent,
  ScriptedAgent,
  ScriptedAgentContext,
} from "../../scriptedAgents";
import { DelegateAgentFunction } from "../../functions/DelegateScriptedAgent";
import { OnGoalAchievedFunction } from "../../functions/OnGoalAchieved";
import { OnGoalFailedFunction } from "../../functions/OnGoalFailed";
import { Scripter } from "../Scripter";
import { ResultErr } from "@polywrap/result";
import { VerifyGoalAchievedFunction } from "../../functions/VerifyGoalAchieved";

export interface EvoRunArgs {
  goal: string
}

export class Evo extends AgentBase<EvoRunArgs, ScriptedAgentContext> {
  constructor(
    llm: LlmApi,
    chat: Chat,
    logger: Logger,
    workspace: Workspace,
    scripts: Scripts,
    env: Env,
    timeout?: Timeout,
    scriptedAgents?: ScriptedAgent[]
  ) {
    const context: ScriptedAgentContext = {
      llm,
      chat,
      workspace,
      scripts,
      logger,
      variables: new AgentVariables(),
      client: new WrapClient(workspace, logger, agentPlugin({ logger }), env),
      env,
    };

    const defaultScriptedAgents = [
      new DeveloperAgent({
        ...context,
        chat: new Chat(context.chat.tokenizer, context.chat.contextWindow),
      }),
      new ResearcherAgent({
        ...context,
        chat: new Chat(context.chat.tokenizer, context.chat.contextWindow),
      }
      ),
      new DataAnalystAgent({
        ...context,
        chat: new Chat(context.chat.tokenizer, context.chat.contextWindow),
      }),
    ];

    scriptedAgents = scriptedAgents ?? defaultScriptedAgents;

    const AGENT_NAME = "Evo";

    const onGoalAchievedFn = new OnGoalAchievedFunction(
      context.client,
      context.scripts
    );
    const onGoalFailedFn = new OnGoalFailedFunction(
      context.client,
      context.scripts
    );
    const verifyGoalAchieved = new VerifyGoalAchievedFunction(context.client, context.scripts);

    const config: AgentBaseConfig<EvoRunArgs> = {
      name: AGENT_NAME,
      expertise: "an expert evolving assistant that achieves user goals",
      initialMessages: ({ goal }) => [
        {
          role: "user",
          content: `Purpose:
          You are an expert assistant designed to achieve user goals.
          
          Functionalities:
          You have multiple agents you can delegate a task to by calling the relevant delegate{Agent} functions.
          Since the agents do not see user messages, it is crucial you pass all the required information to the agents. Do not leave out relevant context from the user.
          
          Decision-making Process:
          1. Evaluate the goal, see if it can be achieved without delegating to another agent.
          2. Sub-tasks are delegated to agents that have the most relevant expertise.
          3. When you are certain a goal and its sub-tasks have been achieved, you will call ${verifyGoalAchieved.name}.
          4. If you get stuck or encounter an error, think carefully and create a new plan considering the problems you've encountered.
          5. A goal is only failed if you have exhausted all options and you are certain it cannot be achieved. Call ${onGoalFailedFn.name} with information as to what happened.
          
          REMEMBER:
          If info is missing, you assume the info is somewhere on the user's computer like the filesystem, unless you have a logical reason to think otherwise.
          Do not communicate with the user.`,
        },
        {
          role: "user",
          content: goal,
        },
      ],
      loopPreventionPrompt:
        "Assistant, you seem to be looping. Try delegating a task or calling agent_onGoalAchieved or agent_onGoalFailed",
      functions: [
        onGoalAchievedFn,
        onGoalFailedFn,
        verifyGoalAchieved,
        new DelegateAgentFunction(
          new Scripter(
            context.llm,
            new Chat(context.chat.tokenizer, context.chat.contextWindow),
            context.logger,
            context.workspace,
            context.scripts,
            context.env
          )
        ),
      ],
      shouldTerminate: (functionCalled) => {
        return [onGoalAchievedFn.name, onGoalFailedFn.name].includes(
          functionCalled.name
        );
      },
    };

    for (const scriptedAgent of scriptedAgents) {
      config.functions.push(
        new DelegateAgentFunction(
          scriptedAgent,
        )
      );
    }

    super(
      {
        ...config,
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

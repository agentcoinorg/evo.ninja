import { Agent, AgentOutput, Chat, ChatRole, Env, ExecuteAgentFunctionCalled, LlmApi, Logger, RunResult, Timeout, Workspace, basicFunctionCallLoop } from "@evo-ninja/agent-utils";
import { ResultErr } from "@polywrap/result";
import { AgentFunctionBase } from "./AgentFunctionBase";

export interface AgentBaseContext {
  llm: LlmApi;
  chat: Chat;
  logger: Logger;
  workspace: Workspace;
  env: Env;
}

export interface AgentBaseConfig<TRunArgs, TAgentBaseContext> {
  name: string;
  expertise: string;
  persistentMessages: (runArguments: TRunArgs) => { role: ChatRole; content: string }[];
  constraintMessages: (runArguments: TRunArgs) => { role: ChatRole; content: string }[];
  loopPreventionPrompt: string;
  agentSpeakPrompt?: string;
  functions: AgentFunctionBase<TAgentBaseContext, unknown>[];
  shouldTerminate: (functionCalled: ExecuteAgentFunctionCalled) => boolean;
  timeout?: Timeout;
}

export abstract class AgentBase<TRunArgs, TAgentBaseContext extends AgentBaseContext> implements Agent<TRunArgs> {
  public readonly name: string;

  constructor(
    protected config: AgentBaseConfig<TRunArgs, TAgentBaseContext>,
    protected context: TAgentBaseContext
  ) {
    this.name = config.name;
  }

  public get workspace(): Workspace {
    return this.context.workspace;
  }

  public async* run(
    args: TRunArgs,
    context?: string
  ): AsyncGenerator<AgentOutput, RunResult, string | undefined> {
    const { chat } = this.context;
    try {
      this.config.persistentMessages(args).forEach((message) => {
        chat.persistent(message.role, message.content);
      });

      this.config.constraintMessages(args).forEach((message) => {
        chat.constraint(message.role, message.content);
      });

      // If additional context is needed
      if (context) {
        chat.persistent("user", context);
      }

      if (this.config.timeout) {
        setTimeout(this.config.timeout.callback, this.config.timeout.milliseconds);
      }

      return yield* basicFunctionCallLoop(
        this.context,
        this.config.functions.map((fn) => {
          return {
            definition: fn.getDefinition(),
            buildExecutor: (context: TAgentBaseContext) => {
              return fn.buildExecutor(this, context);
            }
          }
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
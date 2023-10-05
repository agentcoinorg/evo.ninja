import { Agent, AgentFunctionResult, AgentOutput, Chat, ChatRole, Env, ExecuteAgentFunctionCalled, LlmApi, Logger, RunResult, Timeout, Workspace, basicFunctionCallLoop } from "@evo-ninja/agent-utils";
import { AgentFunction } from "./types";
import { ResultErr } from "@polywrap/result";

export interface AgentBaseContext {
  llm: LlmApi;
  chat: Chat;
  logger: Logger;
  workspace: Workspace;
  env: Env;
}

export interface AgentBaseConfig<TRunArgs, TAgentBaseContext> {
  initialMessages: (runArguments: TRunArgs) => { role: ChatRole; content: string }[];
  loopPreventionPrompt: string;
  functions: Record<string, {
    definition: AgentFunction;
    buildExecutor: (context: TAgentBaseContext) => (params: any) => Promise<AgentFunctionResult>;
  }>;
  shouldTerminate: (functionCalled: ExecuteAgentFunctionCalled) => boolean;
  timeout?: Timeout;
}

export abstract class AgentBase<TRunArgs, TAgentBaseContext extends AgentBaseContext> implements Agent<TRunArgs> {
  constructor(
    protected config: AgentBaseConfig<TRunArgs, TAgentBaseContext>,
    protected context: TAgentBaseContext
  ) {}
  
  public get workspace(): Workspace {
    return this.context.workspace;
  }

  public async* run(
    args: TRunArgs
  ): AsyncGenerator<AgentOutput, RunResult, string | undefined> {
    const { chat } = this.context;
    try {
      this.config.initialMessages(args).forEach((message) => {
        chat.persistent(message.role, message.content);
      })

      if (this.config.timeout) {
        setTimeout(this.config.timeout.callback, this.config.timeout.milliseconds);
      }

      const functionEntries = Object.entries(this.config.functions);
      const functions = functionEntries.map(([name, { definition, buildExecutor }]) => ({
        definition: {
          ...definition,
          name
        },
        buildExecutor
      }))

      return yield* basicFunctionCallLoop(
        this.context,
        functions,
        (functionCalled) => {
          return this.config.shouldTerminate(functionCalled);
        },
        this.config.loopPreventionPrompt
      );
    } catch (err) {
      this.context.logger.error(err);
      return ResultErr("Unrecoverable error encountered.");
    }
  }
}
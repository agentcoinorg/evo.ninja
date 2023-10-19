import {
  Agent,
  AgentOutput,
  Chat,
  ChatMessage,
  Env,
  ExecuteAgentFunctionCalled,
  LlmApi,
  Logger,
  RunResult,
  Timeout,
  Workspace,
  AgentVariables,
  basicFunctionCallLoop,
  Scripts, 
  WrapClient,
  agentPlugin
} from "@evo-ninja/agent-utils";
import { ResultErr } from "@polywrap/result";
import { AgentFunctionBase } from "./AgentFunctionBase";
import { ReadVariableFunction } from "./functions/ReadVariable";

export class AgentBaseContext {
  constructor(
    public readonly llm: LlmApi,
    public chat: Chat,
    public readonly logger: Logger,
    public readonly workspace: Workspace,
    public readonly env: Env,
    public readonly scripts: Scripts,
    public readonly client: WrapClient = new WrapClient(workspace, logger, agentPlugin({ logger }), env),
    public readonly variables: AgentVariables = new AgentVariables()
  ) {
  }

  cloneEmpty(): AgentBaseContext {
    return new AgentBaseContext(
      this.llm,
      this.chat.cloneEmpty(),
      this.logger,
      this.workspace,
      this.env,
      this.scripts,
      this.client,
      new AgentVariables()
    );
  }
}

export interface AgentPrompts<TRunArgs> {
  name: string;
  expertise: string;
  initialMessages: (runArguments: TRunArgs) => ChatMessage[];
  loopPreventionPrompt: string;
  agentSpeakPrompt?: string;
}

export interface AgentBaseConfig<TRunArgs> {
  prompts: AgentPrompts<TRunArgs>;
  functions: AgentFunctionBase<unknown>[];
  shouldTerminate: (functionCalled: ExecuteAgentFunctionCalled) => boolean;
  timeout?: Timeout;
}

export class AgentBase<TRunArgs, TAgentBaseContext extends AgentBaseContext> implements Agent<TRunArgs> {
  constructor(
    public readonly config: AgentBaseConfig<TRunArgs>,
    protected context: TAgentBaseContext
  ) {
    // Default functions that are added to every agent
    const defaultFunctions = [
      new ReadVariableFunction()
    ];

    // See which functions already exist
    const existingFunctions = new Map(
      this.config.functions.map((x) => ([x.name, x]))
    );

    // Add defaults if they don't already exist
    this.config.functions.push(
      ...defaultFunctions.filter(x => !existingFunctions.has(x.name))
    );
  }

  public get workspace(): Workspace {
    return this.context.workspace;
  }

  public async* run(
    args: TRunArgs,
  ): AsyncGenerator<AgentOutput, RunResult, string | undefined> {
    const { chat } = this.context;
    try {
      this.config.prompts.initialMessages(args).forEach((message) => {
        chat.persistent(message);
      });

      // Add functions to chat
      this.config.functions.forEach((fn) => {
        chat.addFunction(fn.getDefinition());
      });

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
        this.config.prompts.loopPreventionPrompt,
        this.config.prompts.agentSpeakPrompt
      );
    } catch (err) {
      this.context.logger.error(err);
      return ResultErr("Unrecoverable error encountered.");
    }
  }
}
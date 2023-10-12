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
  basicFunctionCallLoop
} from "@evo-ninja/agent-utils";
import { ResultErr } from "@polywrap/result";
import { AgentFunctionBase } from "./AgentFunctionBase";
import { ReadVariableFunction } from "./functions/ReadVariable";

export interface AgentBaseContext {
  llm: LlmApi;
  chat: Chat;
  logger: Logger;
  workspace: Workspace;
  env: Env;
  variables: AgentVariables;
}

export interface AgentBaseConfig<TRunArgs> {
  name: string;
  expertise: string;
  initialMessages: (runArguments: TRunArgs) => ChatMessage[];
  loopPreventionPrompt: string;
  agentSpeakPrompt?: string;
  functions: AgentFunctionBase<unknown>[];
  shouldTerminate: (functionCalled: ExecuteAgentFunctionCalled) => boolean;
  timeout?: Timeout;
}

export class AgentBase<TRunArgs, TAgentBaseContext extends AgentBaseContext> implements Agent<TRunArgs> {
  private _functions: AgentFunctionBase<unknown>[];

  constructor(
    public readonly config: AgentBaseConfig<TRunArgs>,
    protected context: TAgentBaseContext
  ) {
    this._functions = [...this.config.functions];

    // Default functions that are added to every agent
    const defaultFunctions = [
      new ReadVariableFunction()
    ];

    // See which functions don't need to be added
    const shouldAddDefault: Map<string, AgentFunctionBase<unknown> | undefined> = new Map(
      defaultFunctions.map((x) => ([x.name, x]))
    );

    this._functions.forEach((fn) => {
      if (shouldAddDefault.has(fn.name)) {
        shouldAddDefault.set(fn.name, undefined);
      }
    });

    // Add defaults
    shouldAddDefault.forEach((value) => {
      if (value) {
        this._functions.push(value);
      }
    });
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
      this.config.initialMessages(args).forEach((message) => {
        chat.persistent(message);
      });

      // Add an extra prompt informing agent about variable usage
      chat.persistent({
        role: "system",
        content: "You can replace any function argument with a variable by using the \${variable-name} syntax"
      });

      // Add functions to chat
      this._functions.forEach((fn) => {
        chat.addFunction(fn.getDefinition());
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
        this._functions.map((fn) => {
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
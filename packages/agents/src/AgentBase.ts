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
        content: `Variables are annotated using the \${variable-name} syntax. Variables can be used as function argument using the \${variable-name} syntax. Variables are created as needed, and do not exist unless otherwise stated.`
      });

      // Add functions to chat
      this.config.functions.forEach((fn) => {
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
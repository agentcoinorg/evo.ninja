import {
  AgentFunction,
  AgentOutput,
  ChatLogs,
  ExecuteAgentFunctionCalled,
  FunctionDefinition,
  RunResult,
} from "@evo-ninja/agent-utils";
import { AgentContext } from "@evo-ninja/agent-utils";
import { ResultErr } from "@polywrap/result";
import { basicFunctionCallLoop } from "./basicFunctionCallLoop";
import { Agent, AgentConfig } from "../utils";

export abstract class NewAgent<TRunArgs> extends Agent<TRunArgs> {
  constructor(
    public readonly config: AgentConfig<TRunArgs>,
    public readonly context: AgentContext,
  ) { 
    super(config, context);
  }
  public async* run(
    args: TRunArgs,
  ): AsyncGenerator<AgentOutput, RunResult, string | undefined> {
    this.initializeChat(args);
    return yield* this.runWithChat();
  }

  public async* runWithChat(): AsyncGenerator<AgentOutput, RunResult, string | undefined> {
    const { chat } = this.context;
    if (this.config.timeout) {
      setTimeout(
        this.config.timeout.callback,
        this.config.timeout.milliseconds
      );
    }
    try {
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
            buildExecutor: (context: AgentContext) => {
              return fn.buildExecutor(this);
            }
          }
        }),
        (functionCalled: ExecuteAgentFunctionCalled) => {
          return this.config.shouldTerminate(functionCalled);
        },
        this.config.prompts.loopPreventionPrompt,
        this.config.prompts.agentSpeakPrompt,
        this.beforeLlmResponse.bind(this)
      );
    } catch (err) {
      this.context.logger.error(err);
      return ResultErr("Unrecoverable error encountered.");
    }
  }

  protected abstract initializeChat(args: TRunArgs): void;
  protected abstract beforeLlmResponse(): Promise<{ logs: ChatLogs, agentFunctions: FunctionDefinition[], allFunctions: AgentFunction<AgentContext>[]}>;
}

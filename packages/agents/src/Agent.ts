import {
  RunnableAgent,
  ChatMessage,
  Workspace,
  AgentOutput,
  RunResult,
  basicFunctionCallLoop,
} from "@evo-ninja/agent-utils";
import { ResultErr } from "@polywrap/result";
import { AgentConfig } from "./AgentConfig";
import { AgentContext } from "./AgentContext";

export type GoalRunArgs = {
  goal: string;
};

export class Agent<TRunArgs = GoalRunArgs> implements RunnableAgent<TRunArgs> {
  constructor(
    public readonly config: AgentConfig<TRunArgs>,
    public readonly context: AgentContext,
  ) { 
  }

  public get workspace(): Workspace {
    return this.context.workspace;
  }

  public async* run(
    args: TRunArgs,
  ): AsyncGenerator<AgentOutput, RunResult, string | undefined> {
    return yield* this.runWithChat([
      // Add an extra prompt informing agent about variable usage
      {
        role: "system",
        content: `Variables are annotated using the \${variable-name} syntax. Variables can be used as function argument using the \${variable-name} syntax. Variables are created as needed, and do not exist unless otherwise stated.`
      },
      ...this.config.prompts.initialMessages(args)
    ]);
  }

  public async* runWithChat(
    messages: ChatMessage[],
  ): AsyncGenerator<AgentOutput, RunResult, string | undefined> {
    const { chat } = this.context;
    if (this.config.timeout) {
      setTimeout(
        this.config.timeout.callback,
        this.config.timeout.milliseconds
      );
    }
    try {
      for (const message of messages) {
        chat.persistent(message);
      }

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

import {
  RunnableAgent,
  ChatMessage,
  AgentOutput,
  RunResult,
  basicFunctionCallLoop,
  LlmQuery,
  LlmQueryBuilder,
  ChatLogs,
  LlmModel,
  agentFunctionBaseToAgentFunction,
  OpenAIEmbeddingAPI,
  Chat,
  executeAgentFunction,
  FunctionDefinition,
  AgentFunction
} from "@/agent-core";
import { ResultErr } from "@polywrap/result";
import { AgentConfig } from "./AgentConfig";
import { AgentContext } from "@/agent-core";
import { ExecuteAgentFunctionCalled } from "@/agent-core";
import { Prompt } from "./Prompt";
import { AgentFunctionBase } from "../../functions/utils";
import { Workspace } from "@evo-ninja/agent-utils";

export type GoalRunArgs = {
  goal: string;
};

export class Assistant<TRunArgs = GoalRunArgs> implements RunnableAgent<TRunArgs> {
  constructor(
    public readonly config: AgentConfig<TRunArgs>,
    public readonly context: AgentContext,
  ) {}

  public get workspace(): Workspace {
    return this.context.workspace;
  }

  public async* run(
    args: TRunArgs
  ): AsyncGenerator<AgentOutput, RunResult, string | undefined> {
    this.initializeChat(args);

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

  public onFirstRun(_: TRunArgs, chat: Chat): Promise<void> {
    return Promise.resolve();
  }

  protected async executeFunction(func: AgentFunctionBase<unknown>, args: any, chat: Chat): Promise<void> {
    const fn = agentFunctionBaseToAgentFunction(this)(func);
    const { result } = await executeAgentFunction([args, fn], JSON.stringify(args), this.context);

    result.messages.forEach(x => chat.temporary(x));
  }

  protected query(msgs?: ChatMessage[]): LlmQuery {
    return new LlmQuery(this.context.llm, this.context.chat.tokenizer, ChatLogs.from(msgs ?? [], [], this.context.chat.tokenizer));
  }

  protected queryBuilder(msgs?: ChatMessage[]): LlmQueryBuilder {
    return new LlmQueryBuilder(this.context.llm, this.context.chat.tokenizer, msgs);
  }

  protected askLlm(query: string | Prompt, opts?: { maxResponseTokens?: number, model?: LlmModel }): Promise<string> {
    return this.query().ask(query.toString(), opts);
  }
 
  protected async createEmbeddingVector(text: string): Promise<number[]> {
    const embeddingApi = new OpenAIEmbeddingAPI(
      this.context.env.OPENAI_API_KEY,
      this.context.logger,
      this.context.chat.tokenizer
    );

    return (await embeddingApi.createEmbeddings(text))[0].embedding;
  }

  protected initializeChat(args: TRunArgs) {
    for (const message of this.config.prompts.initialMessages(args)) {
      this.context.chat.persistent(message.role, message.content ?? "");
    }
  }

  protected async beforeLlmResponse(): Promise<{ logs: ChatLogs, agentFunctions: FunctionDefinition[], allFunctions: AgentFunction<AgentContext>[]}> {
    return {
      logs: this.context.chat.chatLogs,
      agentFunctions: this.config.functions.map(x => x.getDefinition()),
      allFunctions: this.config.functions.map(agentFunctionBaseToAgentFunction(this))
    }
  }
}

import {
  RunnableAgent,
  ChatMessage,
  Workspace,
  AgentOutput,
  RunResult,
  basicFunctionCallLoop,
  LlmQuery,
  LlmQueryBuilderV2,
  ChatLogs,
  LlmModel,
  agentFunctionBaseToAgentFunction,
  OpenAIEmbeddingAPI,
  Chat,
  executeAgentFunction
} from "@evo-ninja/agent-utils";
import { ResultErr } from "@polywrap/result";
import { AgentConfig } from "./AgentConfig";
import { AgentContext } from "@evo-ninja/agent-utils";
import { ExecuteAgentFunctionCalled } from "@evo-ninja/agent-utils";
import { Prompt } from "./Prompt";
import { AgentFunctionBase } from "../../functions/utils";

export type GoalRunArgs = {
  goal: string;
};

export class Agent<TRunArgs = GoalRunArgs> implements RunnableAgent<TRunArgs> {
  constructor(
    public readonly config: AgentConfig<TRunArgs>,
    public readonly context: AgentContext,
  ) {}

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
        this.config.functions.map(agentFunctionBaseToAgentFunction(this)),
        (functionCalled: ExecuteAgentFunctionCalled) => {
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

  public onFirstRun(_: TRunArgs, chat: Chat): Promise<void> {
    return Promise.resolve();
  }

  protected async executeFunction(func: AgentFunctionBase<unknown>, args: any, chat: Chat): Promise<void> {
    const fn = agentFunctionBaseToAgentFunction(this)(func);
    const { result } = await executeAgentFunction([args, fn], JSON.stringify(args), this.context);

    // Save large results as variables
    for (const message of result.messages) {
      if (message.role !== "function") {
        continue;
      }
      const functionResult = message.content || "";
      if (result.storeInVariable || this.context.variables.shouldSave(functionResult)) {
        const varName = this.context.variables.save(func.name, functionResult);
        message.content = `\${${varName}}`;
      }
    }

    result.messages.forEach(x => chat.temporary(x));
  }

  protected expression(msgs?: ChatMessage[]): LlmQuery {
    return new LlmQuery(this.context.llm, this.context.chat.tokenizer, ChatLogs.from(msgs ?? [], [], this.context.chat.tokenizer));
  }

  protected expressionBuilder(msgs?: ChatMessage[]): LlmQueryBuilderV2 {
    return new LlmQueryBuilderV2(this.context.llm, this.context.chat.tokenizer, msgs);
  }

  protected askLlm(query: string | Prompt, opts?: { maxResponseTokens?: number, model?: LlmModel }): Promise<string> {
    return this.expression().ask(query.toString(), opts);
  }
 
  protected async createEmbeddingVector(text: string): Promise<number[]> {
    const embeddingApi = new OpenAIEmbeddingAPI(
      this.context.env.OPENAI_API_KEY,
      this.context.logger,
      this.context.chat.tokenizer
    );

    return (await embeddingApi.createEmbeddings(text))[0].embedding;
  }
}

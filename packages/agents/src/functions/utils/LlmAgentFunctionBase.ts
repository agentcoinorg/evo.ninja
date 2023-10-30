import { AgentFunctionBase } from "./AgentFunctionBase";
import { Result, ResultErr, ResultOk } from "@polywrap/result";
import { Agent } from "../../agents/utils";
import { AgentContext, AgentOutput, LlmApi, LlmModel, LlmQueryBuilder, Tokenizer } from "@/agent-core";

export abstract class LlmAgentFunctionBase<TParams> extends AgentFunctionBase<TParams> {
  constructor(protected llm: LlmApi, protected tokenizer: Tokenizer) {
    super();
  }

  protected queryBuilder(): LlmQueryBuilder {
    return new LlmQueryBuilder(this.llm, this.tokenizer);
  }

  protected askLlm(question: string, opts?: { maxResponseTokens?: number, model?: LlmModel }): Promise<string> {
    return this.queryBuilder()
      .message("user", question)
      .build()
      .content(opts);
  }

  protected async askAgent<TRunArgs>(
    agent: Agent<TRunArgs>, 
    runArgs: TRunArgs, 
    context: AgentContext
  ): Promise<Result<{output: AgentOutput, messages: string[]}, string | undefined>> {
    let iterator = agent.run(runArgs);

    const messages = [];

    while (true) {
      const response = await iterator.next();

      if (response.done) {
        if (!response.value.ok) {
          return ResultErr(response.value.error);
        }
      
        return ResultOk({ output: response.value.value, messages });
      } else {
        if (response.value.type === "message" && response.value.content) {
          messages.push(response.value.content);
        }
      }

      response.value && context.logger.info(response.value.title);
    }
  }
}

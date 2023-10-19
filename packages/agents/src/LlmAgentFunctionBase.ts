import { LlmApi, Tokenizer, LlmQueryBuilder } from "@evo-ninja/agent-utils";
import { AgentFunctionBase } from "./AgentFunctionBase";

export abstract class LlmAgentFunctionBase<TParams> extends AgentFunctionBase<TParams> {
  constructor(protected llm: LlmApi, protected tokenizer: Tokenizer) {
    super();
  }

  protected queryBuilder(): LlmQueryBuilder {
    return new LlmQueryBuilder(this.llm, this.tokenizer);
  }

  protected askLlm(question: string): Promise<string> {
    return this.queryBuilder()
      .persistent("user", question)
      .build()
      .content();
  }
}

import { AgentContext, LlmQueryBuilder, Prompt, Rag, StandardRagBuilder } from "@evo-ninja/agents";
import { CachedFunc } from "./CachedFunc";

export class LlmAdapter {
  constructor(public readonly context: AgentContext) {
  }

  queryBuilder() {
    return new LlmQueryBuilder(this.context.llm, this.context.chat.tokenizer);
  }

  rag<TItem>() {
    return Rag.standard<TItem>(this.context);
  }

  prompt(text?: string) {
    return new Prompt(text);
  }

  cache<TRes>(id: string, func: () => TRes | Promise<TRes>) {
    return new CachedFunc(id, func, this.context.chat.tokenizer);
  }

  destructure(): {
    queryBuilder: () => LlmQueryBuilder;
    rag: <TItem>() => StandardRagBuilder<TItem>;
    prompt: (text?: string) => Prompt;
    cache: <TRes>(id: string, func: () => TRes | Promise<TRes>) => CachedFunc<TRes>;
  } {
    return {
      queryBuilder: this.queryBuilder.bind(this),
      rag: this.rag.bind(this),
      prompt: this.prompt.bind(this),
      cache: this.cache.bind(this),
    };
  }
}

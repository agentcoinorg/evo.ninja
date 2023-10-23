import { OpenAIEmbeddingAPI, LocalVectorDB, LocalDocument } from "@evo-ninja/agent-utils";
import { v4 as uuid } from "uuid";
import { AgentContext } from "../../AgentContext";

export class StandardRagBuilder<TItem> {
  private _limit: number;
  private _selector: (item: TItem) => string;

  constructor( private readonly _items: TItem[], private readonly context: AgentContext) { }

  limit(limit: number): StandardRagBuilder<TItem> {
    this._limit = limit;
    return this;
  }

  selector(selector: (item: TItem) => string): StandardRagBuilder<TItem> {
    this._selector = selector;
    return this;
  }

  async query(query: string): Promise<RagQuery<TItem>> {
    const embeddingApi = new OpenAIEmbeddingAPI(
      this.context.env.OPENAI_API_KEY,
      this.context.logger,
      this.context.chat.tokenizer
    );

    const db = new LocalVectorDB(this.context.internals, "ragdb", embeddingApi);

    const collection = db.addCollection<{ index: number }>(uuid());

    await collection.add(this._items.map(x => this._selector(x)), this._items.map((_, i) => ({ index: i })));

    const results = await collection.search(query, this._limit);

    return new RagQuery(this._items, results, this._selector);
  }
}

export class RagQuery<TItem> {
  constructor(private readonly items: TItem[], private readonly results: LocalDocument<{ index: number }>[], private readonly selector: (item: TItem) => string) {
  }

  sortByIndex(): RagQuery<TItem> {
    const items = [...this.results]
      .sort((a, b) => {
        return a.metadata()!.index - b.metadata()!.index;
      })
      .map(x => {
        return this.items[x.metadata()!.index];
      });

    return new RagQuery(items, this.results, this.selector);
  }


  sortByRelevance(): RagQuery<TItem> {
    const items = [...this.results]
      .map(x => {
        return this.items[x.metadata()!.index];
      });

    return new RagQuery(items, this.results, this.selector);
  }

  onlyUnique(): TItem[] {
    const set = new Set();
    const uniqueItems = [];
    for (const item of this.items) {
      if (set.has(this.selector(item))) {
        continue;
      }
      uniqueItems.push(item);
      set.add(this.selector(item));
    }

    return uniqueItems;
  }

  withDuplicates(): TItem[] {
    const set = new Set();
    const uniqueItems = [];
    for (const item of this.items) {
      if (set.has(this.selector(item))) {
        continue;
      }
      uniqueItems.push(item);
      set.add(this.selector(item));
    }

    return uniqueItems;
  }
}


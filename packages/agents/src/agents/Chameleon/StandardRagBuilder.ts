import { OpenAIEmbeddingAPI, LocalVectorDB, LocalDocument } from "@evo-ninja/agent-utils";
import { v4 as uuid } from "uuid";
import { AgentContext } from "../../AgentContext";

export class StandardRagBuilder<TItem> {
  private _limit: number;
  private _selector: (item: TItem) => string;
  private _sort: "index" | "relevance";
  private _unique: boolean;

  constructor( private readonly _items: TItem[], private readonly context: AgentContext) { }

  limit(limit: number): StandardRagBuilder<TItem> {
    this._limit = limit;
    return this;
  }

  selector(selector: (item: TItem) => string): StandardRagBuilder<TItem> {
    this._selector = selector;
    return this;
  }

  sortByIndex(): StandardRagBuilder<TItem> {
    this._sort = "index";
    return this;
  }

  sortByRelevance(): StandardRagBuilder<TItem> {
    this._sort = "relevance";
    return this;
  }

  onlyUnique(): StandardRagBuilder<TItem> {
    this._unique = true;
    return this;
  }

  withDuplicates(): StandardRagBuilder<TItem> {
    this._unique = false;
    return this;
  }

  async query(query: string): Promise<TItem[]> {
    const embeddingApi = new OpenAIEmbeddingAPI(
      this.context.env.OPENAI_API_KEY,
      this.context.logger,
      this.context.chat.tokenizer
    );

    const db = new LocalVectorDB(this.context.internals, "ragdb", embeddingApi);

    const collection = db.addCollection<{ index: number }>(uuid());

    await collection.add(this._items.map(x => this._selector(x)), this._items.map((_, i) => ({ index: i })));

    const results = await collection.search(query, this._limit);

    let filteredItems;
    if (this._sort === "index") {
      filteredItems = this._sortByIndex(this._items, results);
    } else {
      filteredItems = this._sortByRelevance(this._items, results);
    }

    if (this._unique) {
      return this._onlyUnique(filteredItems);
    } else {
      return this._withDuplicates(filteredItems);
    }
  }

  private _sortByIndex(items: TItem[], results: LocalDocument<{ index: number }>[]): TItem[] {
    return [...results]
      .sort((a, b) => {
        return a.metadata()!.index - b.metadata()!.index;
      })
      .map(x => {
        return items[x.metadata()!.index];
      });
  }

  private _sortByRelevance(items: TItem[], results: LocalDocument<{ index: number }>[]): TItem[] {
    return [...results]
      .map(x => {
        return items[x.metadata()!.index];
      });
  }

  private _onlyUnique(items: TItem[]): TItem[] {
    const set = new Set();
    const uniqueItems = [];
    for (const item of items) {
      if (set.has(this._selector(item))) {
        continue;
      }
      uniqueItems.push(item);
      set.add(this._selector(item));
    }

    return uniqueItems;
  }

  private _withDuplicates(items: TItem[]): TItem[] {
    const set = new Set();
    const uniqueItems = [];
    for (const item of items) {
      if (set.has(this._selector(item))) {
        continue;
      }
      uniqueItems.push(item);
      set.add(this._selector(item));
    }

    return uniqueItems;
  }
}

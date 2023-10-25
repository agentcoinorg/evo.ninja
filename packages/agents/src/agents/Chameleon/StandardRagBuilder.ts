
import { OpenAIEmbeddingAPI, LocalVectorDB, LocalDocument, LazyArray, filterDuplicates, LocalCollection } from "@evo-ninja/agent-utils";
import { v4 as uuid } from "uuid";
import { AgentContext } from "../../AgentContext";

export class StandardRagBuilder<TItem> {
  private _limit: number;
  // TODO: need to handle cases where TItem is not a string
  private _selector: (item: TItem) => string = x => x as unknown as string;
  private _sort: "index" | "relevance";
  private _unique: boolean;
  private readonly collection: LocalCollection<{ index: number }>;
  private addToCollectionPromise: Promise<unknown>;
  private _items: TItem[];
  private lastAddedItemIndex: number;

  constructor(context: AgentContext, collectionName?: string) {
    const embeddingApi = new OpenAIEmbeddingAPI(
      context.env.OPENAI_API_KEY,
      context.logger,
      context.chat.tokenizer
    );

    const db = new LocalVectorDB(context.internals, "ragdb", embeddingApi);

    this.collection = db.addCollection<{ index: number }>(collectionName ?? uuid());
    this._items = [];
    this.lastAddedItemIndex = -1;
  }

  addItems(items: TItem[]): StandardRagBuilder<TItem> {
    this._items.push(...items);
    return this;
  }

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

  recombine<TRecombine>(recombiner: (results: LazyArray<{item: TItem, doc: LocalDocument<{ index: number }> }>, originalItems: TItem[]) => TRecombine): QueryWithRecombine<TItem, TRecombine> {
    return new QueryWithRecombine<TItem, TRecombine>(this.collection, this._items, this.addToCollectionPromise, this._limit, this._sort, this._unique, recombiner);
  }

  query(query: string): LazyArray<TItem> {
    const itemsToAdd = this._items.slice(this.lastAddedItemIndex + 1);

    const addToCollectionPromise = itemsToAdd.length
      ? this.collection.add(itemsToAdd.map(x => this._selector(x)), itemsToAdd.map((_, i) => ({ index: this.lastAddedItemIndex + i + 1 })))
      : Promise.resolve();
    this.lastAddedItemIndex = this._items.length - 1;
    
    const resultPromise = addToCollectionPromise
      .then(async () => {
        const results = await this.collection.search(query, this._limit);
        let filteredItems;
        if (this._sort === "index") {
          filteredItems = this._sortByIndex(this._items, results);
        } else {
          filteredItems = this._sortByRelevance(this._items, results);
        }
        if (this._unique) {
          return filterDuplicates(filteredItems, x => x);
        } else {
          return filteredItems;
        }
      });

    return new LazyArray(resultPromise);
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
    return results
      .map(x => {
        return items[x.metadata()!.index];
      });
  }
}

export class QueryWithRecombine<TItem, TRecombine> {
  constructor(
    private readonly collection: LocalCollection<{ index: number }>,
    private readonly _items: TItem[],
    private readonly addToCollectionPromise: Promise<unknown>, 
    private readonly _limit: number,
    private readonly _sort: "index" | "relevance",
    private readonly _unique: boolean,
    private readonly _recombine: (results: LazyArray<{item: TItem, doc: LocalDocument<{ index: number }> }>, originalItems: TItem[]) => TRecombine
  ) { }

  query(query: string): TRecombine {
    const resultPromise = this.addToCollectionPromise
      .then(async () => {
        const results = await this.collection.search(query, this._limit);
        let filteredItems: {item: TItem, doc: LocalDocument<{ index: number }> }[];
        if (this._sort === "index") {
          filteredItems = this._sortByIndex(this._items, results);
        } else {
          filteredItems = this._sortByRelevance(this._items, results);
        }
        if (this._unique) {
          return filterDuplicates(filteredItems, x => x);
        } else {
          return filteredItems;
        }
      });

    return this._recombine(new LazyArray(resultPromise), this._items);
  }

  private _sortByIndex(items: TItem[], results: LocalDocument<{ index: number }>[]): {item: TItem, doc: LocalDocument<{ index: number }> }[] {
    return [...results]
      .sort((a, b) => {
        return a.metadata()!.index - b.metadata()!.index;
      })
      .map(x => {
        return {
          item: items[x.metadata()!.index],
          doc: x
        };
      });
  }

  private _sortByRelevance(items: TItem[], results: LocalDocument<{ index: number }>[]): {item: TItem, doc: LocalDocument<{ index: number }> }[] {
    return results
      .map(x => {
        return {
          item: items[x.metadata()!.index],
          doc: x
        };
      });
  }
}


import { OpenAIEmbeddingAPI, LocalVectorDB, LocalDocument } from "@evo-ninja/agent-utils";
import { v4 as uuid } from "uuid";
import { AgentContext } from "../../AgentContext";
import { filterDuplicates } from "./helpers";
import { LazyArray } from "./LazyArray";

export class StandardRagBuilder<TItem> {
  private _limit: number;
  // TODO: need to handle cases where TItem is not a string
  private _selector: (item: TItem) => string = x => x as unknown as string;
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

  query(query: string): LazyArray<TItem> {
    const embeddingApi = new OpenAIEmbeddingAPI(
      this.context.env.OPENAI_API_KEY,
      this.context.logger,
      this.context.chat.tokenizer
    );

    const db = new LocalVectorDB(this.context.internals, "ragdb", embeddingApi);

    const collection = db.addCollection<{ index: number }>(uuid());

    const resultPromise = collection.add(this._items.map(x => this._selector(x)), this._items.map((_, i) => ({ index: i })))
      .then(async () => {
        const results = await collection.search(query, this._limit);
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
    return [...results]
      .map(x => {
        return items[x.metadata()!.index];
      });
  }
}

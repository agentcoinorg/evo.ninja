
import { v4 as uuid } from "uuid";
import { AgentContext } from "../agent/AgentContext";
import { LocalCollection, OpenAIEmbeddingAPI, LocalVectorDB, LocalDocument } from "../embeddings";

export type Recombiner<TItem, TRecombine> = (results: AsyncGenerator<LocalDocument<{ index: number }>>, originalItems: TItem[]) => Promise<TRecombine>;

export class StandardRagBuilderV2<TItem> {
  private _selector: (item: TItem) => string = x => x as unknown as string;
  private readonly collection: LocalCollection<{ index: number }>;
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

  addItems(items: TItem[]): StandardRagBuilderV2<TItem> {
    this._items.push(...items);
    return this;
  }

  selector(selector: (item: TItem) => string): StandardRagBuilderV2<TItem> {
    this._selector = selector;
    return this;
  }

  query(query: string): QueryWithRecombineV2<TItem>
  query(queryVector: number[]): QueryWithRecombineV2<TItem>
  query(queryOrQueryVector: string | number[]): QueryWithRecombineV2<TItem> {
    const itemsToAdd = this._items.slice(this.lastAddedItemIndex + 1);

    const addToCollectionPromise = itemsToAdd.length
      ? this.collection.add(itemsToAdd.map(x => {
        const text = this._selector(x);
        if (typeof text != "string") {
          throw Error("Selector should return a string. Perhaps you forgot to set the selector?");
        }
        return text;
      }), itemsToAdd.map((_, i) => ({ index: this.lastAddedItemIndex + i + 1 })))
      : Promise.resolve();
    this.lastAddedItemIndex = this._items.length - 1;

    return new QueryWithRecombineV2<TItem>(queryOrQueryVector, this.collection, this._items, addToCollectionPromise);
  }
}

export class QueryWithRecombineV2<TItem> {
  constructor(
    private readonly queryOrQueryVector: string | number[],
    private readonly collection: LocalCollection<{ index: number }>,
    private readonly _items: TItem[],
    private readonly addToCollectionPromise: Promise<unknown>, 
  ) { }

  recombine<TRecombine>(recombiner: Recombiner<TItem, TRecombine>): Promise<TRecombine> {
    return this.addToCollectionPromise.then(() => {
      const iterator = this.collection.iterativeSearch(this.queryOrQueryVector);

      return recombiner(iterator, this._items);
    });
  }
}

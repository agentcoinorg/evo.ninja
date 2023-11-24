import { v4 as uuid } from "uuid";
import { AgentContext } from "../agent/AgentContext";
import { LocalCollection, LocalVectorDB, LocalDocument } from "../embeddings";
import { Workspace } from "@evo-ninja/agent-utils";

export type Recombiner<TItem, TRecombine> = (results: () => Promise<AsyncGenerator<LocalDocument<{ index: number }>>>, originalItems: TItem[]) => Promise<TRecombine>;

export class StandardRagBuilder<TItem> {
  private _selector: (item: TItem) => string = x => x as unknown as string;
  private readonly collection: LocalCollection<{ index: number }>;
  private _items: TItem[];
  private lastAddedItemIndex: number;

  constructor(context: AgentContext, collectionName?: string, workspace?: Workspace, items?: TItem[]) {
    const db = new LocalVectorDB(workspace ?? context.internals, "ragdb", context.embedding);

    this.collection = db.addCollection<{ index: number }>(collectionName ?? uuid());
    this._items = items ?? [];
    this.lastAddedItemIndex = items ? items.length - 1 : -1;
  }

  addItems(items: TItem[]): StandardRagBuilder<TItem> {
    this._items.push(...items);
    return this;
  }

  async forceAddItemsToCollection(): Promise<StandardRagBuilder<TItem>> {
    await this.addItemsToCollection();

    return this;
  }

  selector(selector: (item: TItem) => string): StandardRagBuilder<TItem> {
    this._selector = selector;
    return this;
  }

  query(queryOrVector: string | number[]): QueryWithRecombine<TItem> {
    return new QueryWithRecombine<TItem>(queryOrVector, this.collection, this._items, this.forceAddItemsToCollection.bind(this));
  }

  private async addItemsToCollection(): Promise<void> {
    const itemsToAdd = this._items.slice(this.lastAddedItemIndex + 1);

    if (!itemsToAdd.length) {
      return;
    }

    await this.collection.add(
      itemsToAdd.map(x => {
        const text = this._selector(x);
        if (typeof text != "string") {
          throw Error("Selector should return a string. Perhaps you forgot to set the selector?");
        }
        return text;
      }), 
      itemsToAdd.map((_, i) => ({ index: this.lastAddedItemIndex + i + 1 }))
    );

    this.lastAddedItemIndex = this._items.length - 1;
  }
}

export class QueryWithRecombine<TItem> {
  constructor(
    private readonly queryOrVector: string | number[],
    private readonly collection: LocalCollection<{ index: number }>,
    private readonly _items: TItem[],
    private readonly addToCollectionPromise: () => Promise<unknown>, 
  ) { }

  recombine<TRecombine>(recombiner: Recombiner<TItem, TRecombine>): Promise<TRecombine> {
    return recombiner(
      async () => {
        await this.addToCollectionPromise();
        return this.collection.iterativeSearch(this.queryOrVector);
      },
      this._items
    );
  }
}

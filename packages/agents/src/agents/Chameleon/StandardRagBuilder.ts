import { OpenAIEmbeddingAPI, LocalVectorDB } from "@evo-ninja/agent-utils";
import { v4 as uuid } from "uuid";
import { AgentContext } from "../../AgentContext";

export class StandardRagBuilder<TItem> {
  private _limit: number;
  private _items: TItem[];
  private _selector: (item: TItem) => string;

  constructor(private readonly context: AgentContext) { }

  items(items: TItem[]): StandardRagBuilder<TItem> {
    this._items = items;
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

  async query(query: string): Promise<TItem[]> {
    const embeddingApi = new OpenAIEmbeddingAPI(
      this.context.env.OPENAI_API_KEY,
      this.context.logger,
      this.context.chat.tokenizer
    );

    const db = new LocalVectorDB(this.context.internals, "ragdb", embeddingApi);

    const collection = db.addCollection(uuid());

    await collection.add(this._items.map(x => this._selector(x)));

    const results = await collection.search(query, this._limit);

    const texts = results.map(result => result.text());

    return texts.map(text => {
      const item = this._items.find(x => this._selector(x) === text);
      if (!item) {
        throw new Error(`Text ${text} not found in items.`);
      }
      return item;
    });
  }
}

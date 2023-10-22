import { OpenAIEmbeddingAPI, LocalVectorDB } from "@evo-ninja/agent-utils";
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

  async query(query: string): Promise<TItem[]> {
    const embeddingApi = new OpenAIEmbeddingAPI(
      this.context.env.OPENAI_API_KEY,
      this.context.logger,
      this.context.chat.tokenizer
    );

    const db = new LocalVectorDB(this.context.internals, "ragdb", embeddingApi);

    const uuid = Math.floor(Date.now() / 1000).toString(16);

    const collection = db.addCollection(uuid);

    await collection.add(this._items.map(x => this._selector(x)));

    const results = await collection.search(query, this._limit);

    const texts = results.map(result => result.text());

    return texts.map(text => {
      const item = this._items.find(x => this._selector(x) === text);
      if (!item) {
        throw new Error(`Text ${text} not found in items.`);
      }
      return item;
    }).sort((a, b) => a - b);
  }
}

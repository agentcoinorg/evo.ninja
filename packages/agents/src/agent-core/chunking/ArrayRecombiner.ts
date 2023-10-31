import {  LocalDocument } from "../embeddings";
import { Recombiner } from "../rag/StandardRagBuilder";

export class ArrayRecombiner {
  static standard<TItem>(opt: {
    limit?: number,
    sort?: "index" | "relevance",
    unique?: boolean,
  }): Recombiner<TItem, TItem[]> {
    return async (results: () => Promise<AsyncGenerator<LocalDocument<{ index: number }>>>, originalItems: TItem[]): Promise<TItem[]> => {
      const iterator = await results();

      const itemMap = new Map<string, number>();
      const items = [];

      for await (const result of iterator) {
        const index = result.metadata()!.index;
        const text = result.text();
        
        if (opt.unique && itemMap.has(text)) {
          continue;
        }

        if (opt.limit && items.length >= opt.limit) {
          break;
        }

        itemMap.set(text, index);
        items.push({
          item: originalItems[index],
          index,
        });
      }

      const sorted = opt.sort && opt.sort === "index"
        ? items.sort((a, b) => a.index - b.index)
        : items;

      return sorted.map(x => x.item);
    };
  }
}

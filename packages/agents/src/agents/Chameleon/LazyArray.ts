import { filterDuplicates } from "./helpers";

export class LazyArray<TItem> {
  constructor(private readonly items: TItem[] | Promise<TItem[]>) {
  }

  map<TNew>(selector: (item: TItem) => TNew): LazyArray<TNew> {
    if (Array.isArray(this.items)) {
      return new LazyArray(this.items.map(selector));
    } else {
      return new LazyArray(this.items.then(x => x.map(selector)));
    }
  }

  unique(): LazyArray<TItem> {
    if (Array.isArray(this.items)) {
      return new LazyArray(filterDuplicates(this.items, x => x));
    } else {
      return new LazyArray(this.items.then(x => filterDuplicates(x, x => x)));
    }
  }

  uniqueBy<TCompare>(compareBy: (item: TItem) => TCompare): LazyArray<TItem> {
    if (Array.isArray(this.items)) {
      return new LazyArray(filterDuplicates(this.items, compareBy));
    } else {
      return new LazyArray(this.items.then(x => filterDuplicates(x, compareBy)));
    }
  }

  then<TNew>(selector: (item: TItem[]) => TNew): TNew | Promise<TNew> {
    if (Array.isArray(this.items)) {
      return selector(this.items);
    } else {
      return this.items.then(selector);
    }
  }

  async collect(): Promise<TItem[]> {
    return this.items;
  }
}

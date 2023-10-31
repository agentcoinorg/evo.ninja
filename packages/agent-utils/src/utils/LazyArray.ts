export class LazyArray<TItem> implements PromiseLike<TItem[]> {
  constructor(private readonly items: TItem[] | PromiseLike<TItem[]>) {}

  then<TResult1 = TItem[], TResult2 = never>(
    onfulfilled?:
      | ((value: TItem[]) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null
  ): PromiseLike<TResult1 | TResult2> {
    const promise = Array.isArray(this.items)
      ? Promise.resolve(this.items)
      : this.items;

    return promise.then(onfulfilled, onrejected);
  }

  map<TNew>(selector: (item: TItem) => TNew): LazyArray<TNew> {
    if (Array.isArray(this.items)) {
      return new LazyArray(this.items.map(selector));
    } else {
      return new LazyArray(this.items.then((x) => x.map(selector)));
    }
  }

  unique(): LazyArray<TItem> {
    if (Array.isArray(this.items)) {
      return new LazyArray(filterDuplicates(this.items, (x) => x));
    } else {
      return new LazyArray(
        this.items.then((x) => filterDuplicates(x, (x) => x))
      );
    }
  }

  uniqueBy<TCompare>(compareBy: (item: TItem) => TCompare): LazyArray<TItem> {
    if (Array.isArray(this.items)) {
      return new LazyArray(filterDuplicates(this.items, compareBy));
    } else {
      return new LazyArray(
        this.items.then((x) => filterDuplicates(x, compareBy))
      );
    }
  }
}

export const filterDuplicates = <TItem, TCompare>(
  items: TItem[],
  compareBy: (item: TItem) => TCompare
): TItem[] => {
  const set = new Set();
  const uniqueItems = [];
  for (const item of items) {
    if (set.has(compareBy(item))) {
      continue;
    }
    uniqueItems.push(item);
    set.add(compareBy(item));
  }

  return uniqueItems;
};

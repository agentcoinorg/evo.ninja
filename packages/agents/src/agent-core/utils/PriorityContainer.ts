export class PriorityContainer<T> {
  private items: T[] = [];

  constructor(
    private maxSize: number,
    private compareFn: (a: T, b: T) => number
  ) { }

  addItem(item: T): void {
    this.items.push(item);
    this.items.sort(this.compareFn);
    if (this.items.length > this.maxSize) {
      this.items.pop();
    }
  }

  getItems(): T[] {
    return this.items;
  }
}

export class LazyFunc<TRes> {
  constructor(protected readonly func: () => TRes | Promise<TRes>) {
  }

  async exec(): Promise<TRes> {
    return await this.func();
  }
}

import { LazyFunc } from "./LazyFunc";

export async function pipe(
  ...funcs: Func<unknown, unknown>[]
): Promise<Func<unknown, unknown>> {
  let result = undefined;
  for (const func of funcs) {
    if (func instanceof LazyFunc) {
      result = await func.exec();
    } else if (typeof func === "function") {
      result = await func(result);
      if (result instanceof LazyFunc) {
        result = await result.exec();
      }
    } else {
      result = await func;
    }
  }
  return result;
}

export type Func<TArg, TResult> = ((arg: TArg) => TResult | Promise<TResult>)
  | Promise<TResult>
  | TResult;
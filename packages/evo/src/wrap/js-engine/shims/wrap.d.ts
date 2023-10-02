declare interface Result<T = any> {
  ok: boolean;
  error: string | undefined;
  value: T | undefined;
}
declare var __wrap_subinvoke: (
  uri: string,
  name: string,
  args: any
) => Result;

declare var _subinvoke: (
  uri: string,
  name: string,
  args: any
) => Result;

declare const __wrap_debug_log: (
  message: string
) => void;

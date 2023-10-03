import { clean } from "../clean";

export const consoleShim = {
  log: function(...args: any[]) {
    __wrap_subinvoke("plugin/console", "log", { args: clean(args) });
  },
  error: function(...args: any[]) {
    __wrap_subinvoke("plugin/console", "error", { args: clean(args) });
  },
};
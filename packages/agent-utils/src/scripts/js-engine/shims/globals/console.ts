import { clean } from "../clean";

export const consoleShim = {
  log: function(...args: any[]) {
    __wrap_subinvoke("plugin/console", "log", { args: clean(args) });
  },
  error: function(...args: any[]) {
    __wrap_subinvoke("plugin/console", "error", { args: clean(args) });
  },
};

// language=JavaScript
module.exports = `var consoleShim = {
    log: function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        __wrap_subinvoke("plugin/console", "log", { args: clean(args) });
    },
    error: function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        __wrap_subinvoke("plugin/console", "error", { args: clean(args) });
    },
};`
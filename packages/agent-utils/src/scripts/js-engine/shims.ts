import { globalToShimVarNameMap } from "./shims/globals";

const cleanShim = require("./shims/clean");
const requireShim = require("./shims/globals/require");
const mathShim = require("./shims/globals/math");
const dateShim = require("./shims/globals/date");
const consoleShim = require("./shims/globals/console");

export const packagesShim = 
`'use strict';

${cleanShim}

${requireShim}

${mathShim}

${dateShim}

${consoleShim}

var processShim = {
  "cwd": () =>  __wrap_subinvoke("plugin/process", "cwd", {}).value,
};

var globalToShimVarNameMap = {
    require: "requireShim",
    Math: "mathShim",
    Date: "dateShim",
    console: "consoleShim",
    process: "processShim",
};`;

export const shimCode = (code: string) => `
  ${packagesShim}

  ${Object.entries(globalToShimVarNameMap).map(([global, shim]) => `var ${global} = ${shim};`).join("\n")}

  const __temp = (async function () { 
  ${code}
  })().then(result => {
          __wrap_subinvoke("plugin/result", "ok", { value: clean(result) })
        }, error => {
          __wrap_subinvoke("plugin/result", "err", { error: clean(error) })
        });
  clean(__temp)
`

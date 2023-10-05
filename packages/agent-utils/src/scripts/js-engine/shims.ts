import { globalToShimVarNameMap } from "./shims/globals";

const cleanShim = require("./shims/clean");
const requireShim = require("./shims/globals/require");
const mathShim = require("./shims/globals/math");
const dateShim = require("./shims/globals/date");
const consoleShim = require("./shims/globals/console");
const processShim = require("./shims/globals/process");

export const packagesShim = 
`'use strict';

${cleanShim}

${requireShim}

${mathShim}

${dateShim}

${consoleShim}

${processShim}`;

export const shimCode = (code: string) => `
  ${packagesShim}

  var globalToShimVarNameMap = ${JSON.stringify(globalToShimVarNameMap, null, 2)};
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

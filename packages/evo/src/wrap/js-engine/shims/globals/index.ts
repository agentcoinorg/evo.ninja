import {
  requireShim
} from "./require"

import {
  mathShim
} from "./math"
import { dateShim } from "./date";
import { consoleShim } from "./console";

export const globalsShim = {
  require: {
    shim: requireShim,
    name: "requireShim",
  },
  Math: {
    shim: mathShim,
    name: "mathShim",
  },
  Date: {
    shim: dateShim,
    name: "dateShim",
  },
  console: {
    shim: consoleShim,
    name: "consoleShim",
  },
}
import {
  requireShim
} from "./require"

import {
  mathShim
} from "./math"
import { DateShim } from "./date";

const globalObject = typeof globalThis !== 'undefined' ? globalThis : global || self;

// @ts-ignore
globalObject.require = requireShim;
// @ts-ignore
globalObject.Math = mathShim;
// @ts-ignore
globalObject.Date = DateShim
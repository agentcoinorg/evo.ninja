export {
  requireShim
} from "./require"

export {
  mathShim
} from "./math"
export { dateShim } from "./date";
export { consoleShim } from "./console";

export const globalToShimVarNameMap = {
  require: "requireShim",
  Math: "mathShim",
  Date: "dateShim",
  console:"consoleShim",
}
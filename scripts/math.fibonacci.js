const fs = require("fs");

const result = __wrap_subinvoke(
  "wrap://ipfs/QmXTYY4HAhurxZURrnRM8uD2oBCog8ATYDruVekuXQB192",
  "fibonacci_loop",
  { n }
)
fs.writeFileSync("debug.txt", JSON.stringify(result, null, 2), "utf8");
if (!result.ok) {
  throw result.error;
}
return result.value;
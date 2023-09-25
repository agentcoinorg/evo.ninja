const result = __wrap_subinvoke(
  "wrap://ipfs/QmXKA6qc3TMiBZn5DyydYwdc9o2uSShqFdV7yTgYjF2xdu",
  "get_links",
  { uri }
)
if (!result.ok) {
  throw result.error;
}
return result.value;
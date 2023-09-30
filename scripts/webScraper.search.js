const result = __wrap_subinvoke(
  "plugin/websearch",
  "search",
  { query }
)
if (!result.ok) {
  throw result.error;
}
return result.value;

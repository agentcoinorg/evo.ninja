const result = __wrap_subinvoke(
  "plugin/fuzzySearch",
  "search",
  { url, queryKeywords }
)
if (!result.ok) {
  throw result.error;
}
return result.value;

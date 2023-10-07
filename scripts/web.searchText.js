const result = __wrap_subinvoke(
  "plugin/searchText",
  "search",
  { url, queryKeywords }
)
if (!result.ok) {
  throw result.error;
}
return result.value;

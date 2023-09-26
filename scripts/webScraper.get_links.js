const result = __wrap_subinvoke(
  "wrapscan.io/polywrap/web-scraper@1.0.0",
  "get_links",
  { uri }
)
if (!result.ok) {
  throw result.error;
}
return result.value;
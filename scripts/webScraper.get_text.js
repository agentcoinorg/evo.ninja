const result = __wrap_subinvoke(
  "wrap://ipfs/QmSAiRST1WxJ4q3JxEPgGJvedZa3mQ8ym1RbL9SKJGnVsd",
  "get_text",
  { uri }
)
if (!result.ok) {
  throw result.error;
}
return result.value;
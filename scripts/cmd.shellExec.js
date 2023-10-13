const result = __wrap_subinvoke(
  "plugin/cmd",
  "shellExec",
  { command, args }
)
if (!result.ok) {
  throw result.error;
}
return result.value;

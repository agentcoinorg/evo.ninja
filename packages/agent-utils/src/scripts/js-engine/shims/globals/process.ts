export const processShim = {
  "cwd": () =>  __wrap_subinvoke("plugin/process", "cwd", {}).value,
}
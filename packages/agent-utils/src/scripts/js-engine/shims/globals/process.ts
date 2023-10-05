export const processShim = {
  "cwd": () =>  __wrap_subinvoke("plugin/process", "cwd", {}).value,
}

// language=JavaScript
module.exports = `var processShim = {
  "cwd": () =>  __wrap_subinvoke("plugin/process", "cwd", {}).value,
};`
export const mathShim = {
  random: () => {
    return __wrap_subinvoke("plugin/math", "random", {}).value;
  }
};
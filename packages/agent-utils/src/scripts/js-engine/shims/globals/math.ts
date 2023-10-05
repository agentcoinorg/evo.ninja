export const mathShim = {
  random: () => {
    return __wrap_subinvoke("plugin/math", "random", {}).value;
  }
};

// language=JavaScript
module.exports = `var mathShim = {
    random: function () {
        return __wrap_subinvoke("plugin/math", "random", {}).value;
    }
};`
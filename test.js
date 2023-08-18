
const console = {
  log: (message) => {
    __wrap_subinvoke("plugin/console", "log", { message: JSON.stringify(message) });
  },
};
function require(lib) {
  function wrap(objName, obj) {
    const origin = {};
    return new Proxy(origin, {
      get(_, name) {
        return function () {
          if (obj[name]) {
            return obj[name](...arguments);
          } else {
            throw new Error(`No method ${name} in ${objName}`);
          }
        };
      },
    });
  }

  switch (lib) {
    case "fs":
        return wrap("fs", {
            readFileSync: (path) => {
                return __wrap_subinvoke("plugin/fs", "readFileSync", { path }).value;
            },
            writeFileSync: (path, data) => {
                return __wrap_subinvoke("plugin/fs", "writeFileSync", { path, data }).value;
            },
            appendFileSync: (path, data) => {
                return __wrap_subinvoke("plugin/fs", "appendFileSync", { path, data }).value;
            },
            existsSync: (path) => {
                return __wrap_subinvoke("plugin/fs", "existsSync", { path }).value;
            },
            unlinkSync: (path) => {
                return __wrap_subinvoke("plugin/fs", "unlinkSync", { path }).value;
            },
            renameSync: (oldPath, newPath) => {
                return __wrap_subinvoke("plugin/fs", "renameSync", { oldPath, newPath }).value;
            },
            mkdirSync: (path) => {
                return __wrap_subinvoke("plugin/fs", "mkdirSync", { path }).value;
            },
            readdirSync: (path) => {
                return __wrap_subinvoke("plugin/fs", "readdirSync", { path }).value;
            }
        });
        break;
      case "axios":
        return wrap("axios", {
            get: (url, config) => {
              return new Promise(resolve => resolve(__wrap_subinvoke("plugin/axios", "get", { url, config }).value));
            },
            post: (url, data, config) => {
              return new Promise(resolve => resolve(__wrap_subinvoke("plugin/axios", "post", { url, data, config }).value));
            },
            put: (url, data, config) => {
              return new Promise(resolve => resolve(__wrap_subinvoke("plugin/axios", "put", { url, data, config }).value));
            },
            delete: (url, config) => {
              return new Promise(resolve => resolve(__wrap_subinvoke("plugin/axios", "delete", { url, config }).value));
            },
            head: (url, config) => {
              return new Promise(resolve => resolve(__wrap_subinvoke("plugin/axios", "head", { url, config }).value));
            },
        });
        break;
    default:
      throw new Error(`Cannot do require('${lib}'), '${lib}' is an unknown import.`);
  }
}

const __temp = (async function () { 
  // OPERATION CODE HERE (do not forget to declare arguments of the operation function as local vars)

  const currency = 'ethereum';
  const axios = require('axios');

  const url = 'https://api.coingecko.com/api/v3/simple/price';
  
  const params = {
    ids: currency,
    vs_currencies: 'usd'
  };

  try {
    const response = await axios.get(url, { params });

    return response.data[currency].usd;
  } catch (error) {
    throw new Error(`Could not fetch price for ${currency}: ${error.message}`);
  }
  //END OPERATION CODE
 })().then(result => {
  __wrap_subinvoke("plugin/result", "post", { result: result != null ? result : "undefined" })
}, error => {
  __wrap_subinvoke("plugin/result", "post", { result: error != null ? error : "undefined" })
});
const result = __temp === undefined ? "undefined" : __temp;
result

export const nodeShims = 
`
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
            throw new Error(\`No method \${name} in \${objName}\`);
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
            // This is hack because 'undefined' is not supported by JSON
            return config
              ? new Promise(resolve => resolve(__wrap_subinvoke("plugin/axios", "get", { url, config }).value))
              : new Promise(resolve => resolve(__wrap_subinvoke("plugin/axios", "get", { url }).value));
          },
          post: (url, data, config) => {
            return config
              ? new Promise(resolve => resolve(__wrap_subinvoke("plugin/axios", "post", { url, data, config }).value))
              : new Promise(resolve => resolve(__wrap_subinvoke("plugin/axios", "post", { url, data }).value));
          },
          put: (url, data, config) => {
            return config
              ? new Promise(resolve => resolve(__wrap_subinvoke("plugin/axios", "put", { url, data, config }).value))
              : new Promise(resolve => resolve(__wrap_subinvoke("plugin/axios", "put", { url, data }).value));
          },
          delete: (url, config) => {
            return config
              ? new Promise(resolve => resolve(__wrap_subinvoke("plugin/axios", "delete", { url, config }).value))
              : new Promise(resolve => resolve(__wrap_subinvoke("plugin/axios", "delete", { url}).value));
            
          },
          head: (url, config) => {
            return config
              ? new Promise(resolve => resolve(__wrap_subinvoke("plugin/axios", "head", { url, config }).value))
              : new Promise(resolve => resolve(__wrap_subinvoke("plugin/axios", "head", { url }).value));
          },
        });
        break;
    default:
      throw new Error(\`Cannot do require('\${lib}'), '\${lib}' is an unknown import.\`);
  }
}
`;

export const functionCodeWrapper = (code: string) => `\nconst __temp = (async function () { \n${code}\n })().then(result => {
  __wrap_subinvoke("plugin/result", "post", { result: result != null ? result : "undefined" })
}, error => {
  __wrap_subinvoke("plugin/result", "post", { result: error != null ? error : "undefined" })
});\nconst result = __temp === undefined ? "undefined" : __temp;\nresult`;
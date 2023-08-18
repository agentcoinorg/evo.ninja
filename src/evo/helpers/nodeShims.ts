
export const nodeShims = 
`
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
            get: (url) => {
              return new Promise(resolve => resolve(__wrap_subinvoke("plugin/axios", "get", { url }).value));
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
      throw new Error(\`Cannot do require('\${lib}'), '\${lib}' is an unknown import.\`);
  }
}
`;
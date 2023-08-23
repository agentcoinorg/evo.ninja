export const packagesShim =
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
        if (obj[name]) {
          return obj[name];
        } else {
          throw new Error(\`No method \${name} in \${objName}\`);
        }
      },
    });
  }

  const fs = {
    readFileSync: (path) => {
      return __wrap_subinvoke("plugin/fs", "readFileSync", { path }).value;
    },
    readFile: (path) => {
      return Promise.resolve(__wrap_subinvoke("plugin/fs", "readFileSync", { path }).value);
    },
    writeFileSync: (path, data) => {
      return __wrap_subinvoke("plugin/fs", "writeFileSync", { path, data }).value;
    },
    writeFile: (path, data) => {
      return Promise.resolve(__wrap_subinvoke("plugin/fs", "writeFileSync", { path, data }).value);
    },
    appendFileSync: (path, data) => {
      return __wrap_subinvoke("plugin/fs", "appendFileSync", { path, data }).value;
    },
    appendFile: (path, data) => {
      return Promise.resolve(__wrap_subinvoke("plugin/fs", "appendFileSync", { path, data }).value);
    },
    existsSync: (path) => {
      return __wrap_subinvoke("plugin/fs", "existsSync", { path }).value;
    },
    exists: (path) => {
      return Promise.resolve(__wrap_subinvoke("plugin/fs", "existsSync", { path }).value);
    },
    unlinkSync: (path) => {
      return __wrap_subinvoke("plugin/fs", "unlinkSync", { path }).value;
    },
    unlink: (path) => {
      return Promise.resolve(__wrap_subinvoke("plugin/fs", "unlinkSync", { path }).value);
    },
    renameSync: (oldPath, newPath) => {
      return __wrap_subinvoke("plugin/fs", "renameSync", { oldPath, newPath }).value;
    },
    rename: (oldPath, newPath) => {
      return Promise.resolve(__wrap_subinvoke("plugin/fs", "renameSync", { oldPath, newPath }).value);
    },
    mkdirSync: (path) => {
      return __wrap_subinvoke("plugin/fs", "mkdirSync", { path }).value;
    },
    mkdir: (path) => {
      return Promise.resolve(__wrap_subinvoke("plugin/fs", "mkdirSync", { path }).value);
    },
    readdirSync: (path) => {
      return __wrap_subinvoke("plugin/fs", "readdirSync", { path }).value;
    },
    readdir: (path) => {
      return Promise.resolve(__wrap_subinvoke("plugin/fs", "readdirSync", { path }).value);
    }
  };

  switch (lib) {
    case "fs":
        return wrap("fs", {
          ...fs,
          promises: fs, 
        });
        break;
    case "axios":
      return wrap("axios", {
        get: (url, config) => {
          // This is hack because 'undefined' is not supported by JSON
          return config
            ? Promise.resolve(__wrap_subinvoke("plugin/axios", "get", { url, config }).value)
            : Promise.resolve(__wrap_subinvoke("plugin/axios", "get", { url }).value);
        },
        post: (url, data, config) => {
          return config
            ? Promise.resolve(__wrap_subinvoke("plugin/axios", "post", { url, data, config }).value)
            : Promise.resolve(__wrap_subinvoke("plugin/axios", "post", { url, data }).value);
        },
        put: (url, data, config) => {
          return config
            ? Promise.resolve(__wrap_subinvoke("plugin/axios", "put", { url, data, config }).value)
            : Promise.resolve(__wrap_subinvoke("plugin/axios", "put", { url, data }).value);
        },
        delete: (url, config) => {
          return config
            ? Promise.resolve(__wrap_subinvoke("plugin/axios", "delete", { url, config }).value)
            : Promise.resolve(__wrap_subinvoke("plugin/axios", "delete", { url}).value);
        },
        head: (url, config) => {
          return config
            ? Promise.resolve(__wrap_subinvoke("plugin/axios", "head", { url, config }).value)
            : Promise.resolve(__wrap_subinvoke("plugin/axios", "head", { url }).value);
        },
      });
      break;
    default:
      throw new Error(\`Cannot do require('\${lib}'), '\${lib}' is an unknown import.\`);
  }
}
`;

export const shimCode = (code: string) => `${packagesShim}\nconst __temp = (async function () { \n${code}\n })().then(result => {
  __wrap_subinvoke("plugin/result", "post", { result: result != null ? result : "undefined" })
}, error => {
  __wrap_subinvoke("plugin/result", "post", { result: error != null ? error : "undefined" })
});\nconst result = __temp === undefined ? "undefined" : __temp;\nresult`;

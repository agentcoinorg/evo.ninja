// language=javascript
import { dateShim } from "./Date";

export const packagesShim =
`
${dateShim}
  
// HACK: This is a hack because undefined, null, and functions are not supported by the JS Engine
function clean(obj, root = true) {
  if (obj === undefined) {
    return root ? "undefined" : undefined;
  } else if (obj === null) {
    return root ? "null" : undefined;
  } else if (Array.isArray(obj)) {
    return obj.map(x => clean(x, false)).filter(x => x !== undefined);
  } else if (obj instanceof Error) {
    return { message: obj.message };
  } else if (typeof obj === 'function') {
    return root ? "function" : undefined;
  } else if (typeof obj !== 'object') {
    return obj;
  }

  for (let key in obj) {
    let value = clean(obj[key], false);
    if (value === undefined) {
      delete obj[key];
    } else {
      obj[key] = value;
    }
  }
  return obj;
}

const console = {
  log: function(...args) {
    __wrap_subinvoke("plugin/console", "log", { args: clean(args) });
  },
  error: function(...args) {
    __wrap_subinvoke("plugin/console", "error", { args: clean(args) });
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
      return __wrap_subinvoke("plugin/fs", "readFileSync", clean({ path })).value;
    },
    readFile: (...args) => {
      const callback = args[args.length - 1];
      const result = __wrap_subinvoke("plugin/fs", "readFileSync", clean({ path: args[0] }));
      callback && callback(result.error ? new Error(result.error) : undefined, result.value);
    },
    writeFileSync: (path, data) => {
      return __wrap_subinvoke("plugin/fs", "writeFileSync", clean({ path, data })).value;
    },
    writeFile: (...args) => {
      const callback = args[args.length - 1];
      const result = __wrap_subinvoke("plugin/fs", "writeFileSync", clean({ path: args[0], data: args[1] }));
      callback && callback(result.error ? new Error(result.error) : undefined, result.value);
    },
    appendFileSync: (path, data) => {
      return __wrap_subinvoke("plugin/fs", "appendFileSync", clean({ path, data })).value;
    },
    appendFile: (...args) => {
      const callback = args[args.length - 1];
      const result = __wrap_subinvoke("plugin/fs", "appendFileSync", clean({ path: args[0], data: args[1] }));
      callback && callback(result.error ? new Error(result.error) : undefined, result.value);
    },
    existsSync: (path) => {
      return __wrap_subinvoke("plugin/fs", "existsSync", clean({ path })).value;
    },
    exists: (...args) => {
      const callback = args[args.length - 1];
      const result = __wrap_subinvoke("plugin/fs", "existsSync", clean({ path: args[0] }));
      callback && callback(result.error ? new Error(result.error) : undefined, result.value);
    },
    renameSync: (oldPath, newPath) => {
      return __wrap_subinvoke("plugin/fs", "renameSync", clean({ oldPath, newPath })).value;
    },
    rename: (...args) => {
      const callback = args[args.length - 1];
      const result = __wrap_subinvoke("plugin/fs", "renameSync", clean({ oldPath: args[0], newPath: args[1] }));
      callback && callback(result.error ? new Error(result.error) : undefined, result.value);
    },
    mkdirSync: (path) => {
      return __wrap_subinvoke("plugin/fs", "mkdirSync", clean({ path })).value;
    },
    mkdir: (...args) => {
      const callback = args[args.length - 1];
      const result = __wrap_subinvoke("plugin/fs", "mkdirSync", clean({ path: args[0] }));
      callback && callback(result.error ? new Error(result.error) : undefined, result.value);
    },
    readdirSync: (path) => {
      return __wrap_subinvoke("plugin/fs", "readdirSync", clean({ path })).value;
    },
    readdir: (...args) => {
      const callback = args[args.length - 1];
      const result = __wrap_subinvoke("plugin/fs", "readdirSync", clean({ path: args[0] }));
      callback && callback(result.error ? new Error(result.error) : undefined, result.value);
    },
  };

  const fsPromises = {
    readFile: (path) => {
      return Promise.resolve(fs.readFileSync(path));
    },
    writeFile: (path, data) => {
      return Promise.resolve(fs.writeFileSync(path, data));
    },
    appendFile: (path, data) => {
      return Promise.resolve(fs.appendFileSync(path, data));
    },
    exists: (path) => {
      return Promise.resolve(fs.existsSync(path));
    },
    rename: (oldPath, newPath) => {
      return Promise.resolve(fs.renameSync(oldPath, newPath));
    },
    mkdir: (path) => {
      return Promise.resolve(fs.mkdirSync(path));
    },
    readdir: (path) => {
      return Promise.resolve(fs.readdirSync(path));
    }
  };

  const axios = {
    get: (url, config) => {
      return Promise.resolve(__wrap_subinvoke("plugin/axios", "get", clean({ url, config })).value);
    },
    post: (url, data, config) => {
      return Promise.resolve(__wrap_subinvoke("plugin/axios", "post", clean({ url, data, config })).value);
    },
    put: (url, data, config) => {
      return Promise.resolve(__wrap_subinvoke("plugin/axios", "put", clean({ url, data, config })).value);
    },
    delete: (url, config) => {
      return Promise.resolve(__wrap_subinvoke("plugin/axios", "delete", clean({ url, config })).value);
    },
    head: (url, config) => {
      return Promise.resolve(__wrap_subinvoke("plugin/axios", "head", clean({ url, config })).value);
    },
  };

  const path = {
    resolve: (pathSegments) => {
      return __wrap_subinvoke("plugin/path", "resolve", clean({ pathSegments })).value
    },
    normalize: (path) => {
      return __wrap_subinvoke("plugin/path", "normalize", clean({ path })).value
    },
    isAbsolute: (path) => {
      return __wrap_subinvoke("plugin/path", "isAbsolute", clean({ path })).value
    },
    join: (path) => {
      return __wrap_subinvoke("plugin/path", "join", clean({ path })).value
    },
    relative: (from, to) => {
      return __wrap_subinvoke("plugin/path", "relative", clean({ from, to })).value
    },
    dirname: (path) => {
      return __wrap_subinvoke("plugin/path", "dirname", clean({ path })).value
    },
    basename: (path) => {
      return __wrap_subinvoke("plugin/path", "basename", clean({ path, ext })).value
    },
    format: (pathObject) => {
      return __wrap_subinvoke("plugin/path", "format", clean({ pathObject })).value
    },
    parse: (path) => {
      return __wrap_subinvoke("plugin/path", "parse", clean({ path })).value
    }
  };

  const util = (function() {
    const exports = {};

    var getOwnPropertyDescriptors = 
      function getOwnPropertyDescriptors(obj) {
        var keys = Object.keys(obj);
        var descriptors = {};
        for (var i = 0; i < keys.length; i++) {
          descriptors[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
        }
        return descriptors;
      };
        
    var kCustomPromisifiedSymbol = undefined;

    exports.promisify = function promisify(original) {
      if (typeof original !== 'function')
        throw new TypeError('The "original" argument must be of type Function');

      if (kCustomPromisifiedSymbol && original[kCustomPromisifiedSymbol]) {
        var fn = original[kCustomPromisifiedSymbol];
        if (typeof fn !== 'function') {
          throw new TypeError('The "util.promisify.custom" argument must be of type Function');
        }
        Object.defineProperty(fn, kCustomPromisifiedSymbol, {
          value: fn, enumerable: false, writable: false, configurable: true
        });
        return fn;
      }

      function fn() {
        var promiseResolve, promiseReject;
        var promise = new Promise(function (resolve, reject) {
          promiseResolve = resolve;
          promiseReject = reject;
        });

        var args = [];
        for (var i = 0; i < arguments.length; i++) {
          args.push(arguments[i]);
        }
        args.push(function (err, value) {
          if (err) {
          promiseReject(err);
          } else {
          promiseResolve(value);
          }
        });

        try {
          original.apply(this, args);
        } catch (err) {
          promiseReject(err);
        }

        return promise;
      }

      Object.setPrototypeOf(fn, Object.getPrototypeOf(original));

      if (kCustomPromisifiedSymbol) Object.defineProperty(fn, kCustomPromisifiedSymbol, {
        value: fn, enumerable: false, writable: false, configurable: true
      });
      return Object.defineProperties(
        fn,
        getOwnPropertyDescriptors(original)
      );
    }

    return exports;
  })();

  switch (lib) {
    case "fs":
      return wrap("fs", {
        ...fs,
        promises: fsPromises, 
      });
    case "util":
      return wrap("util", util);
    case "axios":
      return wrap("axios", axios);
    case "path":
      return wrap("path", path);
    default:
      throw new Error(\`Cannot do require('\${lib}'), '\${lib}' is an unknown import.\`);
  }
}

Math.random = function() {
  return __wrap_subinvoke("plugin/math", "random", {}).value;
};
`;

export const shimCode = (code: string) => `${packagesShim}\nconst __temp = (async function () { \n${code}\n })().then(result => {
  __wrap_subinvoke("plugin/result", "ok", { value: clean(result) })
}, error => {
  __wrap_subinvoke("plugin/result", "err", { error: clean(error) })
});\nclean(__temp)`;

import { clean } from "../clean";

export const requireShim = (lib: string) => {
  const fs = {
    readFileSync: (path: string) => {
      return __wrap_subinvoke("plugin/fs", "readFileSync", clean({ path })).value;
    },
    readFile: (...args: any[]) => {
      const callback = args[args.length - 1];
      const result = __wrap_subinvoke("plugin/fs", "readFileSync", clean({ path: args[0] }));
      callback && callback(result.error ? new Error(result.error) : undefined, result.value);
    },
    writeFileSync: (path: string, data: string) => {
      return __wrap_subinvoke("plugin/fs", "writeFileSync", clean({ path, data })).value;
    },
    writeFile: (...args: any[]) => {
      const callback = args[args.length - 1];
      const result = __wrap_subinvoke("plugin/fs", "writeFileSync", clean({ path: args[0], data: args[1] }));
      callback && callback(result.error ? new Error(result.error) : undefined, result.value);
    },
    appendFileSync: (path: string, data: string) => {
      return __wrap_subinvoke("plugin/fs", "appendFileSync", clean({ path, data })).value;
    },
    appendFile: (...args: any[]) => {
      const callback = args[args.length - 1];
      const result = __wrap_subinvoke("plugin/fs", "appendFileSync", clean({ path: args[0], data: args[1] }));
      callback && callback(result.error ? new Error(result.error) : undefined, result.value);
    },
    existsSync: (path: string) => {
      return __wrap_subinvoke("plugin/fs", "existsSync", clean({ path })).value;
    },
    exists: (...args: any[]) => {
      const callback = args[args.length - 1];
      const result = __wrap_subinvoke("plugin/fs", "existsSync", clean({ path: args[0] }));
      callback && callback(result.error ? new Error(result.error) : undefined, result.value);
    },
    renameSync: (oldPath: string, newPath: string) => {
      return __wrap_subinvoke("plugin/fs", "renameSync", clean({ oldPath, newPath })).value;
    },
    rename: (...args: any[]) => {
      const callback = args[args.length - 1];
      const result = __wrap_subinvoke("plugin/fs", "renameSync", clean({ oldPath: args[0], newPath: args[1] }));
      callback && callback(result.error ? new Error(result.error) : undefined, result.value);
    },
    mkdirSync: (path: string) => {
      return __wrap_subinvoke("plugin/fs", "mkdirSync", clean({ path })).value;
    },
    mkdir: (...args: any[]) => {
      const callback = args[args.length - 1];
      const result = __wrap_subinvoke("plugin/fs", "mkdirSync", clean({ path: args[0] }));
      callback && callback(result.error ? new Error(result.error) : undefined, result.value);
    },
    readdirSync: (path: string) => {
      return __wrap_subinvoke("plugin/fs", "readdirSync", clean({ path })).value;
    },
    readdir: (...args: any[]) => {
      const callback = args[args.length - 1];
      const result = __wrap_subinvoke("plugin/fs", "readdirSync", clean({ path: args[0] }));
      callback && callback(result.error ? new Error(result.error) : undefined, result.value);
    },
    promises: {
      readFile: (path: string) => {
        return Promise.resolve(fs.readFileSync(path));
      },
      writeFile: (path: string, data: string) => {
        return Promise.resolve(fs.writeFileSync(path, data));
      },
      appendFile: (path: string, data: string) => {
        return Promise.resolve(fs.appendFileSync(path, data));
      },
      exists: (path: string) => {
        return Promise.resolve(fs.existsSync(path));
      },
      rename: (oldPath: string, newPath: string) => {
        return Promise.resolve(fs.renameSync(oldPath, newPath));
      },
      mkdir: (path: string) => {
        return Promise.resolve(fs.mkdirSync(path));
      },
      readdir: (path: string) => {
        return Promise.resolve(fs.readdirSync(path));
      }
    }
  };

  const axios = {
    get: (url: string, config: any) => {
      return Promise.resolve(__wrap_subinvoke("plugin/axios", "get", clean({ url, config })).value);
    },
    post: (url: string, data: string, config: any) => {
      return Promise.resolve(__wrap_subinvoke("plugin/axios", "post", clean({ url, data, config })).value);
    },
    put: (url: string, data: string, config: any) => {
      return Promise.resolve(__wrap_subinvoke("plugin/axios", "put", clean({ url, data, config })).value);
    },
    delete: (url: string, config: any) => {
      return Promise.resolve(__wrap_subinvoke("plugin/axios", "delete", clean({ url, config })).value);
    },
    head: (url: string, config: any) => {
      return Promise.resolve(__wrap_subinvoke("plugin/axios", "head", clean({ url, config })).value);
    },
  };

  const path = {
    resolve: (pathSegments: any) => {
      return __wrap_subinvoke("plugin/path", "resolve", clean({ pathSegments })).value
    },
    normalize: (path: string) => {
      return __wrap_subinvoke("plugin/path", "normalize", clean({ path })).value
    },
    isAbsolute: (path: string) => {
      return __wrap_subinvoke("plugin/path", "isAbsolute", clean({ path })).value
    },
    join: (path: string) => {
      return __wrap_subinvoke("plugin/path", "join", clean({ path })).value
    },
    relative: (from: string, to: string) => {
      return __wrap_subinvoke("plugin/path", "relative", clean({ from, to })).value
    },
    dirname: (path: string) => {
      return __wrap_subinvoke("plugin/path", "dirname", clean({ path })).value
    },
    basename: (path: string) => {
      return __wrap_subinvoke("plugin/path", "basename", clean({
        path,
        ext: undefined // TODO
      })).value
    },
    extname: (path: string) => {
      return __wrap_subinvoke("plugin/path", "extname", clean({
        path
      })).value
    },
    format: (pathObject: any) => {
      return __wrap_subinvoke("plugin/path", "format", clean({ pathObject })).value
    },
    parse: (path: string) => {
      return __wrap_subinvoke("plugin/path", "parse", clean({ path })).value
    }
  };

  function wrap(objName: string, obj: any) {
    const origin = {};
    return new Proxy(origin, {
      get(_, name) {
        if (obj[name]) {
          return obj[name];
        } else {
          throw new Error(`No method ${name.toString()} in ${objName}`);
        }
      },
    });
  }

  const util = (function() {
    const exports = {} as any;

    let getOwnPropertyDescriptors = 
      function getOwnPropertyDescriptors(obj: any) {
        let keys = Object.keys(obj);
        let descriptors = {} as any;
        for (let i = 0; i < keys.length; i++) {
          descriptors[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
        }
        return descriptors;
      };
        
    let kCustomPromisifiedSymbol: any = undefined;

    exports.promisify = function promisify(original: any) {
      if (typeof original !== 'function')
        throw new TypeError('The "original" argument must be of type Function');

      if (kCustomPromisifiedSymbol && original[kCustomPromisifiedSymbol]) {
        let fn = original[kCustomPromisifiedSymbol];
        if (typeof fn !== 'function') {
          throw new TypeError('The "util.promisify.custom" argument must be of type Function');
        }
        Object.defineProperty(fn, kCustomPromisifiedSymbol, {
          value: fn, enumerable: false, writable: false, configurable: true
        });
        return fn;
      }

      function fn() {
        let promiseResolve: any, promiseReject: any;
        let promise = new Promise(function (resolve, reject) {
          promiseResolve = resolve;
          promiseReject = reject;
        });

        let args: any[] = [];
        for (let i = 0; i < arguments.length; i++) {
          args.push(arguments[i]);
        }
        args.push(function (err: any, value: any) {
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
      return wrap("fs", fs);
    case "path":
      return wrap("path", path);
    case "util":
      return wrap("util", util);
    case "axios":
      return wrap("axios", axios);
    default:
      throw new Error(`Cannot do require('${lib}'), '${lib}' is an unknown import.`);
  }
}

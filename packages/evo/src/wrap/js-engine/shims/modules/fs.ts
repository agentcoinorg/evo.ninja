import { clean } from "./clean";

export const fs = {
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
    writeFile: (path: string, data: any) => {
      return Promise.resolve(fs.writeFileSync(path, data));
    },
    appendFile: (path: string, data: any) => {
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
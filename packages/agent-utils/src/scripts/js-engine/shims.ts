import { globalToShimVarNameMap } from "./shims/globals";
export const packagesShim = 
`'use strict';

// HACK: This is a hack because undefined, null, and functions are not supported by the JS Engine
function clean(obj, root = true) {
    if (obj === undefined) {
        return root ? "undefined" : undefined;
    }
    else if (obj === null) {
        return root ? "null" : undefined;
    }
    else if (Array.isArray(obj)) {
        return obj.map(x => clean(x, false)).filter(x => x !== undefined);
    }
    else if (obj instanceof Error) {
        return { message: obj.message };
    }
    else if (typeof obj === 'function') {
        return root ? "function" : undefined;
    }
    else if (typeof obj !== 'object') {
        return obj;
    }
    for (let key in obj) {
        let value = clean(obj[key], false);
        if (value === undefined) {
            delete obj[key];
        }
        else {
            obj[key] = value;
        }
    }
    return obj;
}

const requireShim = (lib) => {
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
        promises: {
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
            return __wrap_subinvoke("plugin/path", "resolve", clean({ pathSegments })).value;
        },
        normalize: (path) => {
            return __wrap_subinvoke("plugin/path", "normalize", clean({ path })).value;
        },
        isAbsolute: (path) => {
            return __wrap_subinvoke("plugin/path", "isAbsolute", clean({ path })).value;
        },
        join: (path) => {
            return __wrap_subinvoke("plugin/path", "join", clean({ path })).value;
        },
        relative: (from, to) => {
            return __wrap_subinvoke("plugin/path", "relative", clean({ from, to })).value;
        },
        dirname: (path) => {
            return __wrap_subinvoke("plugin/path", "dirname", clean({ path })).value;
        },
        basename: (path) => {
            return __wrap_subinvoke("plugin/path", "basename", clean({
                path,
                ext: undefined // TODO
            })).value;
        },
        extname: (path) => {
            return __wrap_subinvoke("plugin/path", "extname", clean({
                path
            })).value;
        },
        format: (pathObject) => {
            return __wrap_subinvoke("plugin/path", "format", clean({ pathObject })).value;
        },
        parse: (path) => {
            return __wrap_subinvoke("plugin/path", "parse", clean({ path })).value;
        }
    };
    function wrap(objName, obj) {
        const origin = {};
        return new Proxy(origin, {
            get(_, name) {
                if (obj[name]) {
                    return obj[name];
                }
                else {
                    throw new Error(\`No method \${name.toString()} in \${objName}\`);
                }
            },
        });
    }
    const util = (function () {
        const exports = {};
        let getOwnPropertyDescriptors = function getOwnPropertyDescriptors(obj) {
            let keys = Object.keys(obj);
            let descriptors = {};
            for (let i = 0; i < keys.length; i++) {
                descriptors[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
            }
            return descriptors;
        };
        let kCustomPromisifiedSymbol = undefined;
        exports.promisify = function promisify(original) {
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
                let promiseResolve, promiseReject;
                let promise = new Promise(function (resolve, reject) {
                    promiseResolve = resolve;
                    promiseReject = reject;
                });
                let args = [];
                for (let i = 0; i < arguments.length; i++) {
                    args.push(arguments[i]);
                }
                args.push(function (err, value) {
                    if (err) {
                        promiseReject(err);
                    }
                    else {
                        promiseResolve(value);
                    }
                });
                try {
                    original.apply(this, args);
                }
                catch (err) {
                    promiseReject(err);
                }
                return promise;
            }
            Object.setPrototypeOf(fn, Object.getPrototypeOf(original));
            if (kCustomPromisifiedSymbol)
                Object.defineProperty(fn, kCustomPromisifiedSymbol, {
                    value: fn, enumerable: false, writable: false, configurable: true
                });
            return Object.defineProperties(fn, getOwnPropertyDescriptors(original));
        };
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
            throw new Error(\`Cannot do require('\${lib}'), '\${lib}' is an unknown import.\`);
    }
};

const mathShim = {
    random: () => {
        return __wrap_subinvoke("plugin/math", "random", {}).value;
    }
};

class dateShim {
    constructor(...args) {
        if (args.length === 0) {
            this._timestamp = Date.now();
        }
        else if (args.length > 1) {
            this._timestamp = Date.UTC(args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
        }
        else if (typeof args[0] === "string") {
            this._timestamp = Date.parse(args[0]);
        }
        else {
            this._timestamp = args[0].timestamp;
        }
    }
    static now() {
        return __wrap_subinvoke("plugin/datetime", "now", clean(undefined)).value;
    }
    static parse(date) {
        return __wrap_subinvoke("plugin/datetime", "parse", clean({ date })).value;
    }
    static UTC(year, month, day, hour, minute, second, millisecond) {
        const args = clean({ year, month, day, hour, minute, second, millisecond });
        return __wrap_subinvoke("plugin/datetime", "UTC", args).value;
    }
    getDate() {
        return __wrap_subinvoke("plugin/datetime", "getDate", clean({ timestamp: this._timestamp })).value;
    }
    getDay() {
        return __wrap_subinvoke("plugin/datetime", "getDate", clean({ timestamp: this._timestamp })).value;
    }
    getFullYear() {
        return __wrap_subinvoke("plugin/datetime", "getFullYear", clean({ timestamp: this._timestamp })).value;
    }
    getHours() {
        return __wrap_subinvoke("plugin/datetime", "getHours", clean({ timestamp: this._timestamp })).value;
    }
    getMilliseconds() {
        return __wrap_subinvoke("plugin/datetime", "getMilliseconds", clean({ timestamp: this._timestamp })).value;
    }
    getMinutes() {
        return __wrap_subinvoke("plugin/datetime", "getMinutes", clean({ timestamp: this._timestamp })).value;
    }
    getMonth() {
        return __wrap_subinvoke("plugin/datetime", "getMonth", clean({ timestamp: this._timestamp })).value;
    }
    getSeconds() {
        return __wrap_subinvoke("plugin/datetime", "getSeconds", clean({ timestamp: this._timestamp })).value;
    }
    getTime() {
        return __wrap_subinvoke("plugin/datetime", "getTime", clean({ timestamp: this._timestamp })).value;
    }
    getTimezoneOffset() {
        return __wrap_subinvoke("plugin/datetime", "getTimezoneOffset", clean({ timestamp: this._timestamp })).value;
    }
    getUTCDate() {
        return __wrap_subinvoke("plugin/datetime", "getUTCDate", clean({ timestamp: this._timestamp })).value;
    }
    getUTCDay() {
        return __wrap_subinvoke("plugin/datetime", "getUTCDay", clean({ timestamp: this._timestamp })).value;
    }
    getUTCFullYear() {
        return __wrap_subinvoke("plugin/datetime", "getUTCFullYear", clean({ timestamp: this._timestamp })).value;
    }
    getUTCHours() {
        return __wrap_subinvoke("plugin/datetime", "getUTCHours", clean({ timestamp: this._timestamp })).value;
    }
    getUTCMilliseconds() {
        return __wrap_subinvoke("plugin/datetime", "getUTCMilliseconds", clean({ timestamp: this._timestamp })).value;
    }
    getUTCMinutes() {
        return __wrap_subinvoke("plugin/datetime", "getUTCMinutes", clean({ timestamp: this._timestamp })).value;
    }
    getUTCMonth() {
        return __wrap_subinvoke("plugin/datetime", "getUTCMonth", clean({ timestamp: this._timestamp })).value;
    }
    getUTCSeconds() {
        return __wrap_subinvoke("plugin/datetime", "getUTCSeconds", clean({ timestamp: this._timestamp })).value;
    }
    setDate(day) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setDate", clean({ timestamp: this._timestamp, day })).value;
        return this._timestamp;
    }
    setFullYear(year) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setFullYear", clean({ timestamp: this._timestamp, year })).value;
        return this._timestamp;
    }
    setHours(hour) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setHours", clean({ timestamp: this._timestamp, hour })).value;
        return this._timestamp;
    }
    setMilliseconds(millisecond) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setMilliseconds", clean({ timestamp: this._timestamp, millisecond })).value;
        return this._timestamp;
    }
    setMinutes(minute) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setMinutes", clean({ timestamp: this._timestamp, minute })).value;
        return this._timestamp;
    }
    setMonth(month) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setMonth", clean({ timestamp: this._timestamp, month })).value;
        return this._timestamp;
    }
    setSeconds(second) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setSeconds", clean({ timestamp: this._timestamp, second })).value;
        return this._timestamp;
    }
    setTime(time) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setTime", clean({ timestamp: this._timestamp, time })).value;
        return this._timestamp;
    }
    setUTCDate(day) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setUTCDate", clean({ timestamp: this._timestamp, day })).value;
        return this._timestamp;
    }
    setUTCFullYear(year) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setUTCFullYear", clean({ timestamp: this._timestamp, year })).value;
        return this._timestamp;
    }
    setUTCHours(hour) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setUTCHours", clean({ timestamp: this._timestamp, hour })).value;
        return this._timestamp;
    }
    setUTCMilliseconds(millisecond) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setUTCMilliseconds", clean({ timestamp: this._timestamp, millisecond })).value;
        return this._timestamp;
    }
    setUTCMinutes(minute) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setUTCMinutes", clean({ timestamp: this._timestamp, minute })).value;
        return this._timestamp;
    }
    setUTCMonth(month) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setUTCMonth", clean({ timestamp: this._timestamp, month })).value;
        return this._timestamp;
    }
    setUTCSeconds(second) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setUTCSeconds", clean({ timestamp: this._timestamp, second })).value;
        return this._timestamp;
    }
    toDateString() {
        return __wrap_subinvoke("plugin/datetime", "toDateString", clean({ timestamp: this._timestamp })).value;
    }
    toISOString() {
        return __wrap_subinvoke("plugin/datetime", "toISOString", clean({ timestamp: this._timestamp })).value;
    }
    toJSON() {
        return __wrap_subinvoke("plugin/datetime", "toJSON", clean({ timestamp: this._timestamp })).value;
    }
    toLocaleDateString() {
        return __wrap_subinvoke("plugin/datetime", "toLocaleDateString", clean({ timestamp: this._timestamp })).value;
    }
    toLocaleString() {
        return __wrap_subinvoke("plugin/datetime", "toLocaleString", clean({ timestamp: this._timestamp })).value;
    }
    toLocaleTimeString() {
        return __wrap_subinvoke("plugin/datetime", "toLocaleTimeString", clean({ timestamp: this._timestamp })).value;
    }
    toString() {
        return __wrap_subinvoke("plugin/datetime", "toString", clean({ timestamp: this._timestamp })).value;
    }
    toTimeString() {
        return __wrap_subinvoke("plugin/datetime", "toTimeString", clean({ timestamp: this._timestamp })).value;
    }
    toUTCString() {
        return __wrap_subinvoke("plugin/datetime", "toUTCString", clean({ timestamp: this._timestamp })).value;
    }
    valueOf() {
        return this._timestamp;
    }
}

const consoleShim = {
    log: function (...args) {
        __wrap_subinvoke("plugin/console", "log", { args: clean(args) });
    },
    error: function (...args) {
        __wrap_subinvoke("plugin/console", "error", { args: clean(args) });
    },
};

const processShim = {
    "cwd": () => __wrap_subinvoke("plugin/process", "cwd", {}).value,
};

const globalToShimVarNameMap = {
    require: "requireShim",
    Math: "mathShim",
    Date: "dateShim",
    console: "consoleShim",
    process: "processShim"
};`;

export const shimCode = (code: string) => `
  ${packagesShim}

  ${Object.entries(globalToShimVarNameMap).map(([global, shim]) => `var ${global} = ${shim};`).join("\n")}

  const __temp = (async function () { 
  ${code}
  })().then(result => {
          __wrap_subinvoke("plugin/result", "ok", { value: clean(result) })
        }, error => {
          __wrap_subinvoke("plugin/result", "err", { error: clean(error) })
        });
  clean(__temp)
`

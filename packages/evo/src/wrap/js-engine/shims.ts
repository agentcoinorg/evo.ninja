import { globalsShim } from "./shims/globals"

export const packagesShim = 
`'use strict';

// HACK: This is a hack because undefined, null, and functions are not supported by the JS Engine
function clean(obj, root) {
    if (root === void 0) { root = true; }
    if (obj === undefined) {
        return root ? "undefined" : undefined;
    }
    else if (obj === null) {
        return root ? "null" : undefined;
    }
    else if (Array.isArray(obj)) {
        return obj.map(function (x) { return clean(x, false); }).filter(function (x) { return x !== undefined; });
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
    for (var key in obj) {
        var value = clean(obj[key], false);
        if (value === undefined) {
            delete obj[key];
        }
        else {
            obj[key] = value;
        }
    }
    return obj;
}

var requireShim = function (lib) {
    var fs = {
        readFileSync: function (path) {
            return __wrap_subinvoke("plugin/fs", "readFileSync", clean({ path: path })).value;
        },
        readFile: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var callback = args[args.length - 1];
            var result = __wrap_subinvoke("plugin/fs", "readFileSync", clean({ path: args[0] }));
            callback && callback(result.error ? new Error(result.error) : undefined, result.value);
        },
        writeFileSync: function (path, data) {
            return __wrap_subinvoke("plugin/fs", "writeFileSync", clean({ path: path, data: data })).value;
        },
        writeFile: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var callback = args[args.length - 1];
            var result = __wrap_subinvoke("plugin/fs", "writeFileSync", clean({ path: args[0], data: args[1] }));
            callback && callback(result.error ? new Error(result.error) : undefined, result.value);
        },
        appendFileSync: function (path, data) {
            return __wrap_subinvoke("plugin/fs", "appendFileSync", clean({ path: path, data: data })).value;
        },
        appendFile: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var callback = args[args.length - 1];
            var result = __wrap_subinvoke("plugin/fs", "appendFileSync", clean({ path: args[0], data: args[1] }));
            callback && callback(result.error ? new Error(result.error) : undefined, result.value);
        },
        existsSync: function (path) {
            return __wrap_subinvoke("plugin/fs", "existsSync", clean({ path: path })).value;
        },
        exists: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var callback = args[args.length - 1];
            var result = __wrap_subinvoke("plugin/fs", "existsSync", clean({ path: args[0] }));
            callback && callback(result.error ? new Error(result.error) : undefined, result.value);
        },
        renameSync: function (oldPath, newPath) {
            return __wrap_subinvoke("plugin/fs", "renameSync", clean({ oldPath: oldPath, newPath: newPath })).value;
        },
        rename: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var callback = args[args.length - 1];
            var result = __wrap_subinvoke("plugin/fs", "renameSync", clean({ oldPath: args[0], newPath: args[1] }));
            callback && callback(result.error ? new Error(result.error) : undefined, result.value);
        },
        mkdirSync: function (path) {
            return __wrap_subinvoke("plugin/fs", "mkdirSync", clean({ path: path })).value;
        },
        mkdir: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var callback = args[args.length - 1];
            var result = __wrap_subinvoke("plugin/fs", "mkdirSync", clean({ path: args[0] }));
            callback && callback(result.error ? new Error(result.error) : undefined, result.value);
        },
        readdirSync: function (path) {
            return __wrap_subinvoke("plugin/fs", "readdirSync", clean({ path: path })).value;
        },
        readdir: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var callback = args[args.length - 1];
            var result = __wrap_subinvoke("plugin/fs", "readdirSync", clean({ path: args[0] }));
            callback && callback(result.error ? new Error(result.error) : undefined, result.value);
        },
        promises: {
            readFile: function (path) {
                return Promise.resolve(fs.readFileSync(path));
            },
            writeFile: function (path, data) {
                return Promise.resolve(fs.writeFileSync(path, data));
            },
            appendFile: function (path, data) {
                return Promise.resolve(fs.appendFileSync(path, data));
            },
            exists: function (path) {
                return Promise.resolve(fs.existsSync(path));
            },
            rename: function (oldPath, newPath) {
                return Promise.resolve(fs.renameSync(oldPath, newPath));
            },
            mkdir: function (path) {
                return Promise.resolve(fs.mkdirSync(path));
            },
            readdir: function (path) {
                return Promise.resolve(fs.readdirSync(path));
            }
        }
    };
    var axios = {
        get: function (url, config) {
            return Promise.resolve(__wrap_subinvoke("plugin/axios", "get", clean({ url: url, config: config })).value);
        },
        post: function (url, data, config) {
            return Promise.resolve(__wrap_subinvoke("plugin/axios", "post", clean({ url: url, data: data, config: config })).value);
        },
        put: function (url, data, config) {
            return Promise.resolve(__wrap_subinvoke("plugin/axios", "put", clean({ url: url, data: data, config: config })).value);
        },
        delete: function (url, config) {
            return Promise.resolve(__wrap_subinvoke("plugin/axios", "delete", clean({ url: url, config: config })).value);
        },
        head: function (url, config) {
            return Promise.resolve(__wrap_subinvoke("plugin/axios", "head", clean({ url: url, config: config })).value);
        },
    };
    var path = {
        resolve: function (pathSegments) {
            return __wrap_subinvoke("plugin/path", "resolve", clean({ pathSegments: pathSegments })).value;
        },
        normalize: function (path) {
            return __wrap_subinvoke("plugin/path", "normalize", clean({ path: path })).value;
        },
        isAbsolute: function (path) {
            return __wrap_subinvoke("plugin/path", "isAbsolute", clean({ path: path })).value;
        },
        join: function (path) {
            return __wrap_subinvoke("plugin/path", "join", clean({ path: path })).value;
        },
        relative: function (from, to) {
            return __wrap_subinvoke("plugin/path", "relative", clean({ from: from, to: to })).value;
        },
        dirname: function (path) {
            return __wrap_subinvoke("plugin/path", "dirname", clean({ path: path })).value;
        },
        basename: function (path) {
            return __wrap_subinvoke("plugin/path", "basename", clean({
                path: path,
                ext: undefined // TODO
            })).value;
        },
        format: function (pathObject) {
            return __wrap_subinvoke("plugin/path", "format", clean({ pathObject: pathObject })).value;
        },
        parse: function (path) {
            return __wrap_subinvoke("plugin/path", "parse", clean({ path: path })).value;
        }
    };
    function wrap(objName, obj) {
        var origin = {};
        return new Proxy(origin, {
            get: function (_, name) {
                if (obj[name]) {
                    return obj[name];
                }
                else {
                    throw new Error("No method ".concat(name.toString(), " in ").concat(objName));
                }
            },
        });
    }
    var util = (function () {
        var exports = {};
        var getOwnPropertyDescriptors = function getOwnPropertyDescriptors(obj) {
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
                var fn_1 = original[kCustomPromisifiedSymbol];
                if (typeof fn_1 !== 'function') {
                    throw new TypeError('The "util.promisify.custom" argument must be of type Function');
                }
                Object.defineProperty(fn_1, kCustomPromisifiedSymbol, {
                    value: fn_1, enumerable: false, writable: false, configurable: true
                });
                return fn_1;
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
            throw new Error("Cannot do require('".concat(lib, "'), '").concat(lib, "' is an unknown import."));
    }
};

var mathShim = {
    random: function () {
        return __wrap_subinvoke("plugin/math", "random", {}).value;
    }
};

var dateShim = /** @class */ (function () {
    function dateShim() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
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
    dateShim.now = function () {
        return __wrap_subinvoke("plugin/datetime", "now", clean(undefined)).value;
    };
    dateShim.parse = function (date) {
        return __wrap_subinvoke("plugin/datetime", "parse", clean({ date: date })).value;
    };
    dateShim.UTC = function (year, month, day, hour, minute, second, millisecond) {
        var args = clean({ year: year, month: month, day: day, hour: hour, minute: minute, second: second, millisecond: millisecond });
        return __wrap_subinvoke("plugin/datetime", "UTC", args).value;
    };
    dateShim.prototype.getDate = function () {
        return __wrap_subinvoke("plugin/datetime", "getDate", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.getDay = function () {
        return __wrap_subinvoke("plugin/datetime", "getDate", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.getFullYear = function () {
        return __wrap_subinvoke("plugin/datetime", "getFullYear", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.getHours = function () {
        return __wrap_subinvoke("plugin/datetime", "getHours", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.getMilliseconds = function () {
        return __wrap_subinvoke("plugin/datetime", "getMilliseconds", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.getMinutes = function () {
        return __wrap_subinvoke("plugin/datetime", "getMinutes", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.getMonth = function () {
        return __wrap_subinvoke("plugin/datetime", "getMonth", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.getSeconds = function () {
        return __wrap_subinvoke("plugin/datetime", "getSeconds", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.getTime = function () {
        return __wrap_subinvoke("plugin/datetime", "getTime", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.getTimezoneOffset = function () {
        return __wrap_subinvoke("plugin/datetime", "getTimezoneOffset", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.getUTCDate = function () {
        return __wrap_subinvoke("plugin/datetime", "getUTCDate", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.getUTCDay = function () {
        return __wrap_subinvoke("plugin/datetime", "getUTCDay", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.getUTCFullYear = function () {
        return __wrap_subinvoke("plugin/datetime", "getUTCFullYear", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.getUTCHours = function () {
        return __wrap_subinvoke("plugin/datetime", "getUTCHours", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.getUTCMilliseconds = function () {
        return __wrap_subinvoke("plugin/datetime", "getUTCMilliseconds", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.getUTCMinutes = function () {
        return __wrap_subinvoke("plugin/datetime", "getUTCMinutes", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.getUTCMonth = function () {
        return __wrap_subinvoke("plugin/datetime", "getUTCMonth", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.getUTCSeconds = function () {
        return __wrap_subinvoke("plugin/datetime", "getUTCSeconds", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.setDate = function (day) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setDate", clean({ timestamp: this._timestamp, day: day })).value;
        return this._timestamp;
    };
    dateShim.prototype.setFullYear = function (year) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setFullYear", clean({ timestamp: this._timestamp, year: year })).value;
        return this._timestamp;
    };
    dateShim.prototype.setHours = function (hour) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setHours", clean({ timestamp: this._timestamp, hour: hour })).value;
        return this._timestamp;
    };
    dateShim.prototype.setMilliseconds = function (millisecond) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setMilliseconds", clean({ timestamp: this._timestamp, millisecond: millisecond })).value;
        return this._timestamp;
    };
    dateShim.prototype.setMinutes = function (minute) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setMinutes", clean({ timestamp: this._timestamp, minute: minute })).value;
        return this._timestamp;
    };
    dateShim.prototype.setMonth = function (month) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setMonth", clean({ timestamp: this._timestamp, month: month })).value;
        return this._timestamp;
    };
    dateShim.prototype.setSeconds = function (second) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setSeconds", clean({ timestamp: this._timestamp, second: second })).value;
        return this._timestamp;
    };
    dateShim.prototype.setTime = function (time) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setTime", clean({ timestamp: this._timestamp, time: time })).value;
        return this._timestamp;
    };
    dateShim.prototype.setUTCDate = function (day) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setUTCDate", clean({ timestamp: this._timestamp, day: day })).value;
        return this._timestamp;
    };
    dateShim.prototype.setUTCFullYear = function (year) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setUTCFullYear", clean({ timestamp: this._timestamp, year: year })).value;
        return this._timestamp;
    };
    dateShim.prototype.setUTCHours = function (hour) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setUTCHours", clean({ timestamp: this._timestamp, hour: hour })).value;
        return this._timestamp;
    };
    dateShim.prototype.setUTCMilliseconds = function (millisecond) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setUTCMilliseconds", clean({ timestamp: this._timestamp, millisecond: millisecond })).value;
        return this._timestamp;
    };
    dateShim.prototype.setUTCMinutes = function (minute) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setUTCMinutes", clean({ timestamp: this._timestamp, minute: minute })).value;
        return this._timestamp;
    };
    dateShim.prototype.setUTCMonth = function (month) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setUTCMonth", clean({ timestamp: this._timestamp, month: month })).value;
        return this._timestamp;
    };
    dateShim.prototype.setUTCSeconds = function (second) {
        this._timestamp = __wrap_subinvoke("plugin/datetime", "setUTCSeconds", clean({ timestamp: this._timestamp, second: second })).value;
        return this._timestamp;
    };
    dateShim.prototype.toDateString = function () {
        return __wrap_subinvoke("plugin/datetime", "toDateString", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.toISOString = function () {
        return __wrap_subinvoke("plugin/datetime", "toISOString", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.toJSON = function () {
        return __wrap_subinvoke("plugin/datetime", "toJSON", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.toLocaleDateString = function () {
        return __wrap_subinvoke("plugin/datetime", "toLocaleDateString", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.toLocaleString = function () {
        return __wrap_subinvoke("plugin/datetime", "toLocaleString", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.toLocaleTimeString = function () {
        return __wrap_subinvoke("plugin/datetime", "toLocaleTimeString", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.toString = function () {
        return __wrap_subinvoke("plugin/datetime", "toString", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.toTimeString = function () {
        return __wrap_subinvoke("plugin/datetime", "toTimeString", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.toUTCString = function () {
        return __wrap_subinvoke("plugin/datetime", "toUTCString", clean({ timestamp: this._timestamp })).value;
    };
    dateShim.prototype.valueOf = function () {
        return this._timestamp;
    };
    return dateShim;
}());

var consoleShim = {
    log: function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        __wrap_subinvoke("plugin/console", "log", { args: clean(args) });
    },
    error: function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        __wrap_subinvoke("plugin/console", "error", { args: clean(args) });
    },
};

var globalsShim = {
    require: {
        shim: requireShim,
        name: "requireShim",
    },
    Math: {
        shim: mathShim,
        name: "mathShim",
    },
    Date: {
        shim: dateShim,
        name: "dateShim",
    },
    console: {
        shim: consoleShim,
        name: "consoleShim",
    },
};`;

const shimGlobals = () => {
  return Object.keys(globalsShim).map((key) => {
    const value = (globalsShim as Record<string, { shim: any, name: string }>)[key];
    return `var ${key} = ${value.name};`;
  }).join("\n");
}

export const shimCode = (code: string) => `
  ${packagesShim}

  ${shimGlobals()}
  const __temp = (async function () { 
  ${code}
  })().then(result => {
          __wrap_subinvoke("plugin/result", "ok", { value: clean(result) })
        }, error => {
          __wrap_subinvoke("plugin/result", "err", { error: clean(error) })
        });
  clean(__temp)
`

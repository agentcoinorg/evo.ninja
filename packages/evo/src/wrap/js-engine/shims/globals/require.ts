import { fs, axios } from "../modules";

export const requireShim = (lib: string) => {
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
    case "util":
      return wrap("util", util);
    case "axios":
      return wrap("axios", axios);
    default:
      throw new Error(`Cannot do require('${lib}'), '${lib}' is an unknown import.`);
  }
}

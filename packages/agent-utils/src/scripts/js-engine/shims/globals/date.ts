import { clean } from "../clean";

export class dateShim {

  _timestamp;

  constructor(...args: any[]) {
    if (args.length === 0) {
      this._timestamp = Date.now();
    } else if (args.length > 1) {
      this._timestamp = Date.UTC(
        args[1],
        args[2],
        args[3],
        args[4],
        args[5],
        args[6],
        args[7]
      );
    } else if (typeof args[0] === "string") {
      this._timestamp = Date.parse(args[0]);
    } else {
      this._timestamp = args[0].timestamp;
    }
  }

  static now() {
    return __wrap_subinvoke("plugin/datetime", "now", clean(undefined)).value;
  }

  static parse(date: any) {
    return __wrap_subinvoke("plugin/datetime", "parse", clean({ date })).value;
  }

  static UTC(year: any, month: any, day: any, hour: any, minute: any, second: any, millisecond: any) {
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

  setDate(day: any) {
    this._timestamp = __wrap_subinvoke("plugin/datetime", "setDate", clean({ timestamp: this._timestamp, day })).value;
    return this._timestamp;
  }

  setFullYear(year: any) {
    this._timestamp = __wrap_subinvoke("plugin/datetime", "setFullYear", clean({ timestamp: this._timestamp, year })).value;
    return this._timestamp;
  }

  setHours(hour: any) {
    this._timestamp = __wrap_subinvoke("plugin/datetime", "setHours", clean({ timestamp: this._timestamp, hour })).value;
    return this._timestamp;
  }

  setMilliseconds(millisecond: any) {
    this._timestamp = __wrap_subinvoke("plugin/datetime", "setMilliseconds", clean({ timestamp: this._timestamp, millisecond })).value;
    return this._timestamp;
  }

  setMinutes(minute: any) {
    this._timestamp = __wrap_subinvoke("plugin/datetime", "setMinutes", clean({ timestamp: this._timestamp, minute })).value;
    return this._timestamp;
  }

  setMonth(month: any) {
    this._timestamp = __wrap_subinvoke("plugin/datetime", "setMonth", clean({ timestamp: this._timestamp, month })).value;
    return this._timestamp;
  }

  setSeconds(second: any) {
    this._timestamp = __wrap_subinvoke("plugin/datetime", "setSeconds", clean({ timestamp: this._timestamp, second })).value;
    return this._timestamp;
  }

  setTime(time: any) {
    this._timestamp = __wrap_subinvoke("plugin/datetime", "setTime", clean({ timestamp: this._timestamp, time })).value;
    return this._timestamp;
  }

  setUTCDate(day: any) {
    this._timestamp = __wrap_subinvoke("plugin/datetime", "setUTCDate", clean({ timestamp: this._timestamp, day })).value;
    return this._timestamp;
  }

  setUTCFullYear(year: any) {
    this._timestamp = __wrap_subinvoke("plugin/datetime", "setUTCFullYear", clean({ timestamp: this._timestamp, year })).value;
    return this._timestamp;
  }

  setUTCHours(hour: any) {
    this._timestamp = __wrap_subinvoke("plugin/datetime", "setUTCHours", clean({ timestamp: this._timestamp, hour })).value;
    return this._timestamp;
  }

  setUTCMilliseconds(millisecond: any) {
    this._timestamp = __wrap_subinvoke("plugin/datetime", "setUTCMilliseconds", clean({ timestamp: this._timestamp, millisecond })).value;
    return this._timestamp;
  }

  setUTCMinutes(minute: any) {
    this._timestamp = __wrap_subinvoke("plugin/datetime", "setUTCMinutes", clean({ timestamp: this._timestamp, minute })).value;
    return this._timestamp;
  }

  setUTCMonth(month: any) {
    this._timestamp = __wrap_subinvoke("plugin/datetime", "setUTCMonth", clean({ timestamp: this._timestamp, month })).value;
    return this._timestamp;
  }

  setUTCSeconds(second: any) {
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
    return this._timestamp
  }
}

// language=JavaScript
module.exports = `var dateShim = /** @class */ (function () {
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
}());`
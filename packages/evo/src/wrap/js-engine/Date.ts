// language=javascript
export const dateShim = `class Date {

  _timestamp;

  constructor(...args) {
    if (args.length === 0) {
      this._timestamp = Date.now();
    } else if (args.length > 1) {
      this._timestamp = Date.UTC(...args);
    } else if (typeof args[0] === "string") {
      this._timestamp = Date.parse(args[0]);
    } else {
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
    return this._timestamp
  }
}
`
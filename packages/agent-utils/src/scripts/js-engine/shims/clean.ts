// HACK: This is a hack because undefined, null, and functions are not supported by the JS Engine
export function clean(obj: any, root = true): any {
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

// language=JavaScript
module.exports = `// HACK: This is a hack because undefined, null, and functions are not supported by the JS Engine
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
}`
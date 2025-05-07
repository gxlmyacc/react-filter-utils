const _toString = Object.prototype.toString;
function isPlainObject(obj: any): obj is Record<string, any> {
  return _toString.call(obj) === '[object Object]';
}

function innumerable<T extends object>(
  obj: T,
  key: string,
  value: any,
  options: PropertyDescriptor = { configurable: true }
) {
  Object.defineProperty(obj, key, { value, ...options });
  return obj;
}

export {
  isPlainObject,
  innumerable,
};

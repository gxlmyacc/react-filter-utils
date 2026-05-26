const _toString = Object.prototype.toString;

/**
 * Returns whether `obj` is a plain object (`[object Object]`).
 * @param obj Value to test
 * @returns `true` for plain objects, otherwise `false`
 */
function isPlainObject(obj: any): obj is Record<string, any> {
  return _toString.call(obj) === '[object Object]';
}

/**
 * Defines a property on `obj` (non-enumerable by default) and returns `obj`.
 * @param obj Target object
 * @param key Property name
 * @param value Property value
 * @param options Optional `PropertyDescriptor`; defaults to `{ configurable: true }`
 * @returns The same `obj` reference
 */
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

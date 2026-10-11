const _toString = Object.prototype.toString;

/**
 * Returns whether `obj` is a plain object (`[object Object]`).
 * @param obj Value to test
 * @returns `true` for plain objects, otherwise `false`
 */
function isPlainObject(obj: any): obj is Record<string, any> {
  return _toString.call(obj) === '[object Object]';
}

/** Defines a property without changing the supplied descriptor. */
function defineProperty<T extends object>(obj: T, key: PropertyKey, descriptor: PropertyDescriptor): T {
  Object.defineProperty(obj, key, descriptor);
  return obj;
}

/** Copies selected own property descriptors without evaluating getters. */
function copyPropertyDescriptors<T extends object>(target: T, source: object, keys: string[]): T {
  keys.forEach(key => {
    const descriptor = Object.getOwnPropertyDescriptor(source, key);
    if (descriptor) {
      defineProperty(target, key, descriptor);
    }
  });
  return target;
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
  return defineProperty(obj, key, { value, ...options });
}

export {
  isPlainObject,
  defineProperty,
  copyPropertyDescriptors,
  innumerable,
};

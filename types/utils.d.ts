/**
 * Returns whether `obj` is a plain object (`[object Object]`).
 * @param obj Value to test
 * @returns `true` for plain objects, otherwise `false`
 */
declare function isPlainObject(obj: any): obj is Record<string, any>;
/**
 * Defines a property on `obj` (non-enumerable by default) and returns `obj`.
 * @param obj Target object
 * @param key Property name
 * @param value Property value
 * @param options Optional `PropertyDescriptor`; defaults to `{ configurable: true }`
 * @returns The same `obj` reference
 */
declare function innumerable<T extends object>(obj: T, key: string, value: any, options?: PropertyDescriptor): T;
export { isPlainObject, innumerable, };

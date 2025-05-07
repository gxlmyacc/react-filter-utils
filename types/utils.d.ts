declare function isPlainObject(obj: any): obj is Record<string, any>;
declare function innumerable<T extends object>(obj: T, key: string, value: any, options?: PropertyDescriptor): T;
export { isPlainObject, innumerable, };

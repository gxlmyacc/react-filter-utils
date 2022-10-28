const _toString = Object.prototype.toString;
function isPlainObject(obj: any): obj is Record<string, any> {
  return _toString.call(obj) === '[object Object]';
}

export {
  isPlainObject
};

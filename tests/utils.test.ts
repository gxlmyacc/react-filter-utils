import { isPlainObject, innumerable } from '../src/utils';

describe('utils', () => {
  describe('isPlainObject', () => {
    it('应识别普通对象', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ a: 1 })).toBe(true);
      expect(isPlainObject(Object.create(null))).toBe(true);
    });

    it('应拒绝非普通对象', () => {
      expect(isPlainObject(null)).toBe(false);
      expect(isPlainObject(undefined)).toBe(false);
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject('')).toBe(false);
      expect(isPlainObject(0)).toBe(false);
      expect(isPlainObject(new Date())).toBe(false);
    });
  });

  describe('innumerable', () => {
    it('应在对象上定义属性并返回原对象', () => {
      const obj = { a: 1 };
      const result = innumerable(obj, 'b', 2);
      expect(result).toBe(obj);
      expect(obj).toHaveProperty('b', 2);
    });

    it('应支持自定义属性描述符', () => {
      const obj = {};
      innumerable(obj, 'flag', true, { enumerable: false, writable: false });
      expect(Object.getOwnPropertyDescriptor(obj, 'flag')).toMatchObject({
        value: true,
        enumerable: false,
        writable: false,
      });
    });
  });
});

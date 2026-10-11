import { isPlainObject, innumerable, defineProperty, copyPropertyDescriptors } from '../src/utils';

describe('utils', () => {
  it('copies selected descriptors without invoking getters and preserves shared setter state', () => {
    let value = 1;
    const getter = jest.fn(() => value);
    const setter = jest.fn((next: number) => {
      value = next;
    });
    const source = {};
    defineProperty(source, 'counter', { get: getter, set: setter, enumerable: false, configurable: true });
    defineProperty(source, 'fixed', { value: 3, writable: false, enumerable: true });
    const target: Record<string, number> = {};
    expect(copyPropertyDescriptors(target, source, ['counter', 'fixed', 'missing'])).toBe(target);
    expect(getter).not.toHaveBeenCalled();
    expect(Object.getOwnPropertyDescriptor(target, 'counter')).toEqual(Object.getOwnPropertyDescriptor(source, 'counter'));
    expect(Object.getOwnPropertyDescriptor(target, 'fixed')).toEqual(Object.getOwnPropertyDescriptor(source, 'fixed'));
    expect(Object.prototype.hasOwnProperty.call(target, 'missing')).toBe(false);
    target.counter = 2;
    expect(target.counter).toBe(2);
    expect(setter).toHaveBeenCalledWith(2);
  });

  it('preserves native errors when a non-configurable property is replaced', () => {
    const target = {};
    const symbol = Symbol('constant');
    expect(defineProperty(target, symbol, { value: 1 })).toBe(target);
    expect(() => defineProperty(target, symbol, { value: 2 })).toThrow(TypeError);
  });

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

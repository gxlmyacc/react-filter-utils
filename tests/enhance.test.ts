import { createFilter } from '../src';

describe('optional enhancements', () => {
  const map = {
    A: { label: '启用', value: 1, category: 'same' },
    B: { label: '禁用', value: 2, category: 'same' },
    C: { label: '启用', value: 1, category: 'other' },
  };

  it('matches the first item and preserves references', () => {
    const filter = createFilter(map, undefined, { enhance: true });
    const list = filter.list;
    expect(filter.itemBy('category', 'same')).toBe(list[0]);
    expect(filter.itemByValue(1)).toBe(list[0]);
    expect(filter.itemByLabel('启用')).toBe(list[0]);
    expect(filter.itemByValue(99)).toBeUndefined();
    expect(filter.itemByLabel('missing')).toBeUndefined();
    expect(filter.itemBy('category', 'missing')).toBeUndefined();
    const groups = filter.groupBy('category');
    expect(groups).toEqual(new Map([['same', [list[0], list[1]]], ['other', [list[2]]]]));
    expect(groups.get('same')?.[0]).toBe(list[0]);
    groups.get('same')?.pop();
    expect(filter.groupBy('category').get('same')).toHaveLength(2);
    expect(list).toHaveLength(3);
  });

  it('preserves missing slots by default and supports separators and ignoring missing values', () => {
    const filter = createFilter(map, null, { enhance: true });
    expect(filter.labelsByValues([1, 99, 2, 1])).toBe('启用,,禁用,启用');
    expect(filter.labelsByValues([99, 1, 99])).toBe(',启用,');
    expect(filter.labelsByValues([99, 100])).toBe(',');
    expect(filter.labelsByValues([1, 99, 2], { separator: '、', ignoreMissing: true })).toBe('启用、禁用');
    expect(filter.labelsByValues([99], { ignoreMissing: true })).toBe('');
    expect(filter.labelsByValues([1, 2], { separator: '' })).toBe('启用禁用');
    expect(filter.labelsByValues([])).toBe('');
  });

  it('reads onGetList once per method and reflects transformations and cache replacement', () => {
    const onGetList = jest.fn((list: { value: number; label: string; category: string; order: number }[]) => list.slice().reverse());
    const filter = createFilter(map, null, { enhance: true, onGetList });
    expect(filter.itemByValue(1)?.category).toBe('other');
    expect(filter.itemByLabel('启用')?.category).toBe('other');
    expect(filter.itemBy('category', 'same')?.value).toBe(2);
    expect(filter.groupBy('category').get('same')?.map(item => item.value)).toEqual([2, 1]);
    expect(filter.labelsByValues([1, 2])).toBe('启用,禁用');
    expect(onGetList).toHaveBeenCalledTimes(5);
    filter.list = [{ value: 4, label: 'New', category: 'new', order: 0 }];
    expect(filter.itemByValue(1)).toBeUndefined();
    expect(filter.itemByValue(4)?.label).toBe('New');
  });

  it('keeps constants, custom resolver properties and external methods ahead of enhancements', () => {
    const resolver = Object.assign((value: number) => String(value), { itemByLabel: 'custom' });
    const filter = createFilter(map, { itemByValue: 1 }, {
      enhance: true,
      filter: resolver,
      external: {
        itemBy() {
          return 'external'; 
        },
        labelsByValues() {
          return 'external labels'; 
        },
      },
    });
    const constant: 1 = filter.itemByValue;
    expect(constant).toBe(1);
    expect(filter.itemBy()).toBe('external');
    expect(filter.labelsByValues()).toBe('external labels');
    expect((filter as any).itemByLabel).toBe('custom');
    expect(filter.groupBy('category').size).toBe(2);
  });

  it('is opt-in and works for empty maps', () => {
    const plain = createFilter(map);
    expect('itemBy' in plain).toBe(false);
    // @ts-expect-error Enhancements are unavailable unless enabled.
    expect(plain.itemBy).toBeUndefined();
    const empty = createFilter({}, null, { enhance: true });
    expect(empty.groupBy('anything' as never).size).toBe(0);
    expect(empty.itemByValue(undefined as never)).toBeUndefined();
    expect(empty.labelsByValues([])).toBe('');
  });

  it('selects properties by value or label and only falls back for missing properties', () => {
    const filter = createFilter({
      A: { label: 'One', value: 1, count: 0, enabled: false, text: '', nullable: null, optional: undefined },
      B: { label: 'One', value: 2, count: 3, enabled: true, text: 'B', nullable: null, optional: undefined },
    }, null, { enhance: true });
    const count: number | undefined = filter.propBy(1, 'count');
    expect(count).toBe(0);
    expect(filter.propBy('One', 'count', 99)).toBe(0);
    expect(filter.propByValue(1, 'enabled', true)).toBe(false);
    expect(filter.propByLabel('One', 'text', 'fallback')).toBe('');
    expect(filter.propByValue(1, 'nullable', 'fallback')).toBeNull();
    expect(filter.propBy(1, 'optional', 'fallback')).toBe('fallback');
    expect(filter.propByValue(99, 'count')).toBeUndefined();
    expect(filter.propByLabel('missing', 'count', 99)).toBe(99);
    expect(filter.propBy('missing', 'count', 99)).toBe(99);
    const numberOrFallback: number | 'missing' = filter.propByValue(99, 'count', 'missing' as const);
    expect(numberOrFallback).toBe('missing');
    // @ts-expect-error Unknown property names are rejected.
    filter.propByValue(1, 'unknown');
    // @ts-expect-error Value queries do not accept labels.
    filter.propByValue('One', 'count');
    // @ts-expect-error Label queries do not accept numeric values.
    filter.propByLabel(1, 'count');
  });

  it('property queries respect final lists, first match and external collisions', () => {
    const onGetList = jest.fn((list: { value: number; label: string; category: string; order: number }[]) => list.slice().reverse());
    const filter = createFilter(map, null, { enhance: true, onGetList });
    expect(filter.propBy(1, 'category')).toBe('other');
    expect(filter.propByValue(1, 'category')).toBe('other');
    expect(filter.propByLabel('启用', 'category')).toBe('other');
    expect(onGetList).toHaveBeenCalledTimes(3);
    const external = createFilter(map, null, {
      enhance: true,
      external: {
        propBy: 'occupied',
        propByValue() {
          return 'custom'; 
        },
        itemByValue() {
          throw new Error('must not call this'); 
        },
      },
    });
    expect(external.propBy).toBe('occupied');
    expect(external.propByValue()).toBe('custom');
    expect(external.propByLabel('启用', 'category')).toBe('same');
    expect(external.labelsByValues([1])).toBe('启用');
    expect(filter.propByValue(99, 'category', 'fallback')).toBe('fallback');
  });

  it('uses Map key equality, including distinct primitive types, missing fields, NaN and object references', () => {
    const object = {};
    const filter = createFilter({ A: 'A' }, null, { enhance: true });
    const list = [1, '1', NaN, NaN, object, object, undefined].map((category, order) => ({ value: 'A' as const, label: 'A', category, order }));
    (filter as any).list = list;
    const groups = (filter as any).groupBy('category') as Map<unknown, typeof list>;
    expect(groups.size).toBe(5);
    expect(groups.get(NaN)).toEqual([list[2], list[3]]);
    expect(groups.get(object)).toEqual([list[4], list[5]]);
    expect(groups.get(undefined)).toEqual([list[6]]);
    expect(groups.get(1)).toEqual([list[0]]);
    expect(groups.get('1')).toEqual([list[1]]);
    expect((filter as any).itemBy('category', NaN)).toBeUndefined();
  });
});

describe('list conversion and order', () => {
  it('types all three conversion stages and final queries without widening to any', () => {
    const filter = createFilter({ A: { label: 'A', value: 1 } }, undefined, {
      enhance: true,
      onWalkListItem: item => ({ ...item, disabled: true }),
      onGetList: list => list.map(item => ({ ...item, value: String(item.value), color: item.disabled ? 'gray' : 'green' })),
      onSetList: list => {
        const disabled: boolean = list[0].disabled;
        expect(disabled).toBe(true);
        // @ts-expect-error Cached values are numeric, before onGetList.
        const wrong: string = list[0].value;
        expect(wrong).toBe(1);
      },
      external(instance) {
        return { color() {
          return instance.list[0].color; 
        } };
      },
    });
    const value: string = filter.list[0].value;
    const color: string | undefined = filter.itemByValue('1')?.color;
    expect(value).toBe('1');
    expect(color).toBe('gray');
    expect(filter.color()).toBe('gray');
    expect(filter.createList(item => item.disabled)[0].color).toBe('gray');
    // @ts-expect-error Final list values have been converted to strings.
    filter.createList([1]);
    // @ts-expect-error Queries also use final values.
    filter.itemByValue(1);
    // @ts-expect-error Query values must match the property type.
    filter.itemBy('disabled', 'yes');
    filter.list = [{ value: 1, label: 'A', order: 0, disabled: true }];
  });

  it('sorts all entries stably and defaults to traversal index, including reverse and skipped entries', () => {
    const filter = createFilter({ A: 'A', B: { label: 'B', order: -1 }, C: 'C', D: { label: 'D', order: 0 } });
    expect(filter.list.map(item => [item.value, item.order])).toEqual([['B', -1], ['A', 0], ['D', 0], ['C', 2]]);
    const reversed = createFilter({ A: 'A', B: 'B', C: 'C' }, null, {
      reverseList: true,
      onWalkListItem(item, index) {
        if (index === 1) {
          return false;
        }
        return { value: item.value, label: item.label };
      },
    });
    expect(reversed.list.map(item => [item.value, item.order])).toEqual([['C', 0], ['A', 2]]);
    const explicit = createFilter({ A: 'A', B: 'B' }, null, {
      onWalkListItem: item => ({ ...item, order: item.value === 'A' ? 5 : -5 }),
    });
    expect(explicit.list.map(item => item.value)).toEqual(['B', 'A']);
  });

  it('exposes default string constants and map, regardless of explicit list values', () => {
    const filter = createFilter({ 1: { label: 'A', value: true } });
    const constant: '1' = filter[1];
    const mapped: '1' = filter.valueMap[1];
    expect(constant).toBe(mapped);
    expect(filter.valueMap).toEqual({ 1: '1' });
    expect(filter.list[0].value).toBe(true);
  });

  it('infers converted types inside external object methods and narrows final items', () => {
    const filter = createFilter({ A: 'A', B: 'B' }, undefined, {
      enhance: true,
      onWalkListItem: item => ({ ...item, color: 'green' }),
      onGetList: list => list.map(item => ({ ...item, value: item.value.length })),
      external: {
        color() {
          const color: string = this.list[0].color;
          const value: number = this.list[0].value;
          return `${color}:${value}`;
        },
      },
    });
    expect(filter.color()).toBe('green:1');
    type Item = typeof filter.list[number];
    const selected = filter.createList((item): item is Item & { value: 1 } => item.value === 1);
    const value: 1 = selected[0].value;
    expect(value).toBe(1);
    const dynamic: boolean = Math.random() >= 0;
    const optional = createFilter({ A: 'A' }, undefined, { enhance: dynamic });
    expect(optional.itemByValue?.('A')?.label).toBe('A');
    // @ts-expect-error Dynamic switches require checking method presence.
    optional.itemByValue('A');
    const mixed = createFilter({ A: { label: 'A', value: 1, color: 'green' }, B: 'B' }, null, { enhance: true });
    expect(mixed.groupBy('color').get(undefined)?.[0].value).toBe('B');
  });

  it('preserves original item extraction and propagates read failures from enhancements', () => {
    const filter = createFilter({ A: { order: 1 }, B: { label: 'B', order: 'invalid' } }, null, { enhance: true });
    expect(filter.list.map(item => item.order)).toEqual([1, 1]);
    expect(filter.list[0].label).toEqual({ order: 1 });
    const failure = new Error('read failed');
    const throwing = createFilter({ A: 'A' }, null, {
      enhance: true,
      onGetList() {
        throw failure; 
      },
    });
    expect(() => throwing.itemByValue('A')).toThrow(failure);
    expect(() => throwing.groupBy('label')).toThrow(failure);
    expect(() => throwing.labelsByValues(['A'])).toThrow(failure);
    expect(() => throwing.propBy('A', 'label')).toThrow(failure);
  });
});

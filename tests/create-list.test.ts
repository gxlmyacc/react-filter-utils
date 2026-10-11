import { createFilter, FilterListItem } from '../src/index';

describe('createList predicates', () => {
  const map = {
    ACTIVE: { label: 'Active', value: 1, disabled: false, color: 'green' },
    INACTIVE: { label: 'Inactive', value: 2, disabled: true, color: 'gray' },
    PENDING: { label: 'Pending', value: 3, disabled: false, color: 'orange' },
  };

  it('filters by metadata, passes all three arguments and keeps cached items intact', () => {
    const filter = createFilter(map);
    const source = filter.list;
    const predicate = jest.fn((item: typeof source[number], index: number, list: typeof source) => {
      expect(list).toBe(source);
      expect(item).toBe(source[index]);
      const color: string = item.color;
      expect(color).toBeTruthy();
      return !item.disabled;
    });
    const selected = filter.createList(predicate);
    expect(selected).toEqual([source[0], source[2]]);
    expect(selected).not.toBe(source);
    expect(selected[0]).toBe(source[0]);
    expect(filter.list).toBe(source);
    expect(source).toHaveLength(3);
    expect(predicate).toHaveBeenCalledTimes(3);
    selected.pop();
    expect(source).toHaveLength(3);
  });

  it('keeps extra fields in contextual callback types', () => {
    const filter = createFilter(map);
    expect(filter.createList((item, index, list) => {
      const color: string = item.color;
      const value: number = list[index].value;
      return color === 'green' && value === 1;
    })).toEqual([filter.list[0]]);
  });

  it('supports truthy filter results, empty lists, and keeping or excluding all items', () => {
    const filter = createFilter(map);
    expect(filter.createList(() => true)).toEqual(filter.list);
    expect(filter.createList(() => false)).toEqual([]);
    expect(filter.createList(item => item.value === 1 ? 'include' : '')).toEqual([filter.list[0]]);
    const empty = createFilter({});
    const predicate = jest.fn(() => true);
    expect(empty.createList(predicate)).toEqual([]);
    expect(predicate).not.toHaveBeenCalled();
    expect(filter.createList()).toEqual(filter.list);
    expect(filter.createList([2])).toEqual([filter.list[1]]);
    expect(filter.createList([])).toEqual([]);
  });

  it('reads onGetList once per selection and respects its transformed order and indices', () => {
    const onGetList = jest.fn((list: FilterListItem<typeof map, null>[]) => [list[2], list[0]]);
    const filter = createFilter(map, null, { onGetList });
    const seen: number[] = [];
    const selected = filter.createList((item, index, list) => {
      seen.push(item.value);
      expect(list.map(entry => entry.value)).toEqual([3, 1]);
      return index === 0;
    });
    expect(seen).toEqual([3, 1]);
    expect(selected.map(item => item.value)).toEqual([3]);
    expect(onGetList).toHaveBeenCalledTimes(1);
  });

  it('propagates predicate exceptions without replacing the cached list', () => {
    const filter = createFilter(map);
    const list = filter.list;
    const failure = new Error('selection failed');
    expect(() => filter.createList(() => {
      throw failure; 
    })).toThrow(failure);
    expect(filter.list).toBe(list);
    expect(filter.createList([1])).toEqual([list[0]]);
  });

  it('narrows the returned item type when a predicate is a type guard', () => {
    const mixedMap = {
      ACTIVE: { label: 'Active', value: 1, color: 'green' },
      PENDING: 'Pending',
    } as const;
    const filter = createFilter(mixedMap);
    type Item = FilterListItem<typeof mixedMap, undefined>;
    type Active = Extract<Item, { value: 1 }>;
    const selected = filter.createList((item): item is Active => item.value === 1);
    const active: Active[] = selected;
    const color: 'green' = selected[0].color;
    expect(active).toEqual([{ value: 1, label: 'Active', color, order: 0 }]);
    // @ts-expect-error The type guard excludes the string-valued Pending item.
    const pending: Extract<Item, { value: 'PENDING' }>[] = selected;
    expect(pending).toBe(selected);
  });
});

describe('filter assembly compatibility', () => {
  it('lets external override createList and existing constants after initialization', () => {
    const filter = createFilter({ A: 'A', B: 'B' }, { ACTIVE: 'A' }, {
      external(instance) {
        expect(instance.ACTIVE).toBe('A');
        expect(instance.createList(['A'])).toEqual([{ value: 'A', label: 'A', order: 0 }]);
        return {
          ACTIVE: 'B',
          createList() {
            return ['custom']; 
          },
          getItem() {
            return 'existing extension'; 
          },
          hasValue() {
            return true; 
          },
        };
      },
    });
    expect(filter.ACTIVE).toBe('B');
    expect(filter.createList()).toEqual(['custom']);
    expect(filter.getItem()).toBe('existing extension');
    expect(filter.hasValue()).toBe(true);
  });

  it('preserves lazy generation and callback ordering on reads and writes', () => {
    const events: string[] = [];
    const filter = createFilter({ A: 'A', B: 'B' }, undefined, {
      onWalkListItem(item) {
        events.push(`walk:${item.value}`); 
      },
      onGetList(list) {
        events.push('get'); return list; 
      },
      onSetList() {
        events.push('set'); 
      },
      external(instance) {
        events.push(`external:${instance.A}`);
        expect(instance.valueMap).toEqual({ A: 'A', B: 'B' });
        return {};
      },
    });
    expect(events).toEqual(['external:A']);
    const first = filter.createList(() => true);
    expect(events).toEqual(['external:A', 'walk:A', 'walk:B', 'get']);
    filter.list = first;
    expect(events[events.length - 1]).toBe('set');
    expect(filter.createList(['A'])).toEqual([first[0]]);
    expect(events).toEqual(['external:A', 'walk:A', 'walk:B', 'get', 'set', 'get']);
  });

  it('keeps constant and external descriptor selection rules', () => {
    const token = Symbol('hidden');
    const values = { A: 'A', [token]: 'ignored' };
    Object.defineProperty(values, 'HIDDEN', { value: 'constant', enumerable: false });
    const external = { '': 'empty name', [token]: 'ignored' };
    Object.defineProperty(external, 'HIDDEN', { value: 'external', enumerable: false, configurable: true });
    const filter = createFilter({ A: 'A' }, values, { external });
    expect(filter.A).toBe('A');
    expect(Object.getOwnPropertyDescriptor(filter, 'HIDDEN')).toEqual({
      value: 'external', writable: false, enumerable: false, configurable: true,
    });
    expect(Object.getOwnPropertyDescriptor(filter, '')?.value).toBe('empty name');
    expect(Object.getOwnPropertySymbols(filter)).toEqual([]);
  });
});

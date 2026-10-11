import { createFilter, createFilterMap, FilterListItem } from '../src/index';

/** Requires both directions of assignability, including detecting accidental never. */
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;

function expectType<T extends true>(value: T) {
  expect(value).toBe(true);
}

describe('list value types', () => {
  it('preserves inline valueMap literals in constants, calls and external methods', () => {
    const filter = createFilter({ 1: 'Active', 2: 'Inactive' }, { ACTIVE: '1', INACTIVE: '2' });
    expectType<Equal<typeof filter.ACTIVE, '1'>>(true);
    expectType<Equal<typeof filter.valueMap.ACTIVE, '1'>>(true);
    expectType<Equal<Parameters<typeof filter>[0], '1' | '2'>>(true);
    expect(filter(filter.ACTIVE)).toBe('Active');
    // @ts-expect-error Only configured valueMap values are accepted.
    expect(filter('3')).toBe('');

    const extended = createFilter({ 1: 'Active' }, { ACTIVE: 1 }, {
      external(filter) {
        expectType<Equal<typeof filter.ACTIVE, 1>>(true);
        return {
          getActive() {
            return filter.ACTIVE;
          },
        };
      },
    });
    expectType<Equal<ReturnType<typeof extended.getActive>, 1>>(true);
    expect(extended.getActive()).toBe(1);

    // @ts-expect-error Mounted constants are readonly, including with literal inference.
    filter.ACTIVE = '1';
  });

  it('retains declared variable types and respects as const variables', () => {
    const map = { 1: 'Active' };
    const valueMap = { ACTIVE: '1' };
    const constantValueMap = { ACTIVE: '1' } as const;
    const widened = createFilter(map, valueMap);
    const literal = createFilter(map, constantValueMap);
    expectType<Equal<typeof widened.ACTIVE, string>>(true);
    expectType<Equal<typeof literal.ACTIVE, '1'>>(true);
    expect(widened.ACTIVE).toBe('1');
    expect(literal.ACTIVE).toBe('1');
  });

  it('uses explicit numeric values independently of valueMap', () => {
    const map = {
      1: { label: 'Active', value: 1, color: 'green' },
      2: { label: 'Inactive', value: 2, color: 'gray' },
    };
    const filter = createFilter(map, { ACTIVE: 1, INACTIVE: 2 });
    const withoutAliases = createFilter(map);
    const stringAliases = createFilter(map, { ACTIVE: '1' });

    expectType<Equal<typeof filter.list[number]['value'], number>>(true);
    expectType<Equal<typeof withoutAliases.list[number]['value'], number>>(true);
    expectType<Equal<typeof stringAliases.list[number]['value'], number>>(true);
    expectType<Equal<typeof filter.ACTIVE, 1>>(true);
    expectType<Equal<typeof stringAliases.ACTIVE, '1'>>(true);
    expectType<Equal<typeof filter.list[number]['color'], string>>(true);
    expect(filter.ACTIVE).toBe(1);
    expect(stringAliases.ACTIVE).toBe('1');
    expect(withoutAliases[1]).toBe('1');
    expect(filter.list).toEqual([
      { label: 'Active', value: 1, color: 'green', order: 0 },
      { label: 'Inactive', value: 2, color: 'gray', order: 1 },
    ]);
    expect(filter.createList([1])).toEqual([filter.list[0]]);
    expect(stringAliases.createList([1])).toEqual([stringAliases.list[0]]);
    // @ts-expect-error Explicit numeric list values do not accept string keys.
    expect(filter.createList(['1'])).toEqual([]);
  });

  it('stringifies numeric keys when no explicit value is provided', () => {
    const filter = createFilter({ 1: 'Active', 2: { label: 'Inactive', color: 'gray' } });
    expectType<Equal<typeof filter.list[number]['value'], '1' | '2'>>(true);
    expect(filter.list.map(item => item.value)).toEqual(['1', '2']);
    expect(filter.createList(['1'])).toEqual([filter.list[0]]);
    const second = filter.list.find(item => item.value === '2');
    expect(second?.color).toBe('gray');
    // @ts-expect-error Numeric map keys become strings in the list.
    expect(filter.createList([1])).toEqual([]);
  });

  it('retains literal values and associated extra fields in mixed maps', () => {
    const map = createFilterMap({
      1: { label: 'Active', value: 1, color: 'green' },
      2: { label: 'Inactive', value: false, disabled: true },
      PENDING: 'Pending',
    } as const);
    const filter = createFilter(map, null, {
      onWalkListItem(item) {
        expectType<Equal<typeof item.value, 1 | false | 'PENDING'>>(true);
        if (item.value === 1) {
          expectType<Equal<typeof item.color, 'green'>>(true);
        }
      },
      onGetList(list) {
        expectType<Equal<typeof list[number]['value'], 1 | false | 'PENDING'>>(true);
        return list;
      },
      onSetList(list) {
        expectType<Equal<typeof list[number]['value'], 1 | false | 'PENDING'>>(true);
        expect(list).toHaveLength(3);
      },
    });
    expectType<Equal<typeof filter.list[number]['value'], 1 | false | 'PENDING'>>(true);
    expect(filter.createList([1, false, 'PENDING'])).toHaveLength(3);
    filter.list = filter.list.slice();
    // @ts-expect-error A const map retains literal numeric values.
    expect(filter.createList([2])).toEqual([]);
  });

  it('supports primitive list values without coercing their types', () => {
    const token = Symbol('token');
    const filter = createFilter({
      NUMBER: { label: 'Zero', value: 0 },
      STRING: { label: 'Empty', value: '' },
      BOOLEAN: { label: 'False', value: false },
      BIGINT: { label: 'Bigint', value: 1n },
      SYMBOL: { label: 'Symbol', value: token },
      NULL: { label: 'Null', value: null },
      UNDEFINED: { label: 'Undefined', value: undefined },
    });
    expectType<Equal<
      typeof filter.list[number]['value'],
      number | string | boolean | bigint | symbol | null | undefined
    >>(true);
    const values = [0, '', false, 1n, token, null, undefined];
    expect(filter.list.map(item => item.value)).toEqual(values);
    for (const value of values) {
      expect(filter.createList([value]).map(item => item.value)).toEqual([value]);
    }
    expect(filter.createList([Symbol('token')])).toEqual([]);
    // @ts-expect-error Objects are not among this map's actual list value types.
    expect(filter.createList([{}])).toEqual([]);
  });

  it('includes the key fallback for optional value properties', () => {
    const map: { A: { label: string; value?: number } } = { A: { label: 'A' } };
    const filter = createFilter(map);
    expectType<Equal<FilterListItem<typeof map, undefined>['value'], number | undefined | 'A'>>(true);
    expect(filter.createList(['A'])).toEqual([{ label: 'A', value: 'A', order: 0 }]);
  });
});

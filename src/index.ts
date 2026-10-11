
import { isPlainObject, innumerable, defineProperty, copyPropertyDescriptors } from './utils';

const REACT_FILTER_PREFIX = 'react-filter-utils:';
const REACT_FILTER_KEY = `${REACT_FILTER_PREFIX}filter`;
const REACT_FILTER_DEFAULT_FILTER = `${REACT_FILTER_PREFIX}default-filter`;

type FilterKeyType = string|number;

/** valueMap keys mounted on the filter instance */
type FilterValueMap<T extends Record<string, any>, V> = V extends Record<string, any>
  ? { readonly [key in keyof V]: V[key] }
  : { readonly [key in keyof T as key extends "" ? never : key extends string | number ? key : never]: key extends string | number ? `${key}` : never };

/** Filter instance shape available as `this` inside `external` methods */
type FilterThis<
  T extends Record<string, any>,
  V,
  F extends FilterFunc<T, V> = FilterFunc<T, V>,
  L extends Record<string, any> = FilterListItem<T, V>,
  C extends Record<string, any> = L,
> = Filter<T, V, F, L, C> & FilterValueMap<T, V>
  & Omit<F, keyof Filter<T, V, F, L, C> | keyof FilterValueMap<T, V>>;

type FilterEx<T extends Record<string, any>, V, F, L extends Record<string, any> = FilterListItem<T, V>, C extends Record<string, any> = L> = FilterThis<T, V, F extends FilterFunc<T, V> ? F : FilterFunc<T, V>, L, C> & {
  [key: string]: any;
};

type ExternalOptions<
  T extends Record<string, any>,
  V,
  F extends FilterFunc<T, V>,
  E extends Record<string, any>,
  L extends Record<string, any> = FilterListItem<T, V>,
  C extends Record<string, any> = L,
> = E & ThisType<FilterThis<T, V, F, L, C> & ResolvedExternal<E>>;

/** Carries inferred external method types from `createExternalFactory` into `createFilter`. */
type ExternalFactoryBrand<E extends Record<string, any>> = {
  readonly __externalMethods?: E;
};

type ExternalFactoryFn<
  T extends Record<string, any>,
  V,
  F extends FilterFunc<T, V>,
  E extends Record<string, any>,
  L extends Record<string, any> = FilterListItem<T, V>,
  C extends Record<string, any> = L,
> = ((filter: FilterThis<T, V, F, L, C>) => E) & ExternalFactoryBrand<E>;

type CreateFilterOptions<
  F extends FilterFunc<T, V>,
  E extends Record<string, any>,
  T extends Record<string, any>,
  V,
  W extends void | boolean | Record<string, any> = void,
  L extends Record<string, any> = WalkedItem<T, V, W>,
  A extends boolean = false,
> = {
  /** Install optional queries after constants and external; occupied names are skipped. */
  enhance?: A,
  reverseList?: boolean,
  filter?: F,
  external?: (E & ThisType<FilterThis<T, V, F, L, WalkedItem<T, V, W>> & ResolvedExternal<E>>)
    | ((filter: FilterThis<T, V, F, L, WalkedItem<T, V, W>>) => E & ThisType<FilterThis<T, V, F, L, WalkedItem<T, V, W>> & ResolvedExternal<E>> | null),
  /** false skips, object replaces, boolean/void otherwise keeps the generated entry. */
  onWalkListItem?: (item: FilterListItem<T, V>, index: number) => W,
  /** Transforms cached entries on each read; its result defines the public list type. */
  onGetList?: (list: WalkedItem<T, V, W>[]) => L[],
  /** Receives the cached (walked) shape on assignment, before onGetList. */
  onSetList?: (list: WalkedItem<T, V, W>[]) => void,
}

/**
 * Wraps an `external` factory so returned methods get `this` typed via `ThisType` (infers `E` from the object).
 * @param factory Receives the filter instance; returned methods may use `this.list`, valueMap keys, etc.
 * @returns Factory suitable for `createFilter(..., { external })`
 */
function createExternalFactory<
  T extends Record<string, any>,
  V,
  E extends Record<string, any>,
  F extends FilterFunc<T, V> = FilterFunc<T, V>,
>(
  factory: (filter: FilterThis<T, V, F>) => ExternalOptions<T, V, F, E>,
): ExternalFactoryFn<T, V, F, E> {
  return factory as ExternalFactoryFn<T, V, F, E>;
}


/** A list entry uses its own value, falling back to the stringified map key. */
type FilterListEntry<Item, Key extends string> = {
  value: Item extends object
    ? 'value' extends keyof Item
      ? Item['value'] | ({} extends Pick<Item, 'value'> ? Key : never)
      : Key
    : Key;
  label: string;
  order: Item extends { order: infer O extends number } ? O : number;
} & (Item extends object ? Omit<Item, 'value' | 'order'> : {});

/** V is retained for compatibility; valueMap only controls instance constants. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type FilterListItem<T, V> = {
  [Key in Extract<keyof T, string | number>]: FilterListEntry<T[Key], `${Key}`>;
}[Extract<keyof T, string | number>];


/** Object returns replace entries; boolean/void returns retain the generated shape. */
type OrderedItem<I> = I extends object ? Omit<I, 'order'> & {
  order: I extends { order: infer O extends number } ? O : number;
} : never;
type WalkedItem<T, V, W> = OrderedItem<Extract<W, Record<string, any>>>
  | ([Extract<W, boolean | void>] extends [never] ? never : FilterListItem<T, V>);

type ResolvedExternal<E> = E extends (...args: any[]) => infer R ? NonNullable<R> : E;

/** Formatting for labelsByValues; missing values occupy empty slots by default. */
type LabelsByValuesOptions = {
  /** Joining delimiter, default comma. */
  separator?: string;
  /** Skip unmatched values instead of keeping empty slots, default false. */
  ignoreMissing?: boolean;
};
type ItemKeys<L> = L extends unknown ? keyof L : never;
type ItemProp<L, P extends PropertyKey> = L extends unknown ? P extends keyof L ? L[P] : undefined : never;
type EnhancedMethods<L extends Record<string, any>> = {
  /** Strict equality, first match from the current list. */
  itemBy<P extends ItemKeys<L>>(prop: P, propValue: ItemProp<L, P>): L | undefined;
  itemByValue(value: L['value']): L | undefined;
  itemByLabel(label: L['label']): L | undefined;
  /** New Map and arrays, preserving current item references and insertion order. */
  groupBy<P extends ItemKeys<L>>(prop: P): Map<ItemProp<L, P>, L[]>;
  /** First value-or-label match; undefined fields use the supplied default. */
  propBy<P extends ItemKeys<L>, D = undefined>(key: L['value'] | L['label'], prop: P, defaultValue?: D): Exclude<ItemProp<L, P>, undefined> | D;
  propByValue<P extends ItemKeys<L>, D = undefined>(value: L['value'], prop: P, defaultValue?: D): Exclude<ItemProp<L, P>, undefined> | D;
  propByLabel<P extends ItemKeys<L>, D = undefined>(label: L['label'], prop: P, defaultValue?: D): Exclude<ItemProp<L, P>, undefined> | D;
  /** Input order and duplicates are preserved; defaults to comma and empty missing slots. */
  labelsByValues(values: L['value'][], options?: LabelsByValuesOptions): string;
};
type EnhancedResult<B, L extends Record<string, any>, A extends boolean> = B & (
  [A] extends [true] ? Omit<EnhancedMethods<L>, keyof B> :
  boolean extends A ? Partial<Omit<EnhancedMethods<L>, keyof B>> : {}
);

type FilterFunc<T extends Record<string, any>, V> = (
  value: V extends Record<string, infer U> ? U : keyof T,
  defaultLabel?: string
) => string;

interface Filter<T extends Record<string, any>, V, F, L extends Record<string, any> = FilterListItem<T, V>, C extends Record<string, any> = L> {
  (...args: Parameters<F extends FilterFunc<T, V> ? F : FilterFunc<T, V>>): string;

  get list(): L[];
  set list(value: C[]);
  createList<S extends L>(
    predicate: (item: L, index: number, list: L[]) => item is S,
  ): S[];
  createList(
    predicate: (item: L, index: number, list: L[]) => unknown,
  ): L[];
  createList(values?: L['value'][]): L[];
  map: T,
  valueMap: V extends Record<string, any> ? V : FilterValueMap<T, V>,
}

/**
 * Returns whether `v` is a filter instance created by `createFilter`.
 * @param v Value to test
 * @returns `true` if the internal filter marker is present
 */
function isFilter(v: any): v is Filter<any, any, any> {
  return v && v[REACT_FILTER_KEY] === true;
}

/**
 * Returns whether the filter uses the default label resolver (no custom `options.filter`).
 * @param v Value to test
 * @returns `true` when `isFilter(v)` and the default resolver is in use
 */
function isDefaultFilter(v: any): v is Filter<any, any, any> {
  return isFilter(v) && (v as any)[REACT_FILTER_DEFAULT_FILTER] === true;
}

/**
 * Helper to define a filter map with stricter literal type inference in TypeScript.
 * @param map Mapping from keys to display labels or `{ label, order?, ... }` objects
 * @returns The same `map` reference
 */
function createFilterMap<T extends Record<string, string|{
  label: string,
  order?: number,
}>>(map: T): T {
  return map;
}

/** Creates the existing map-key label resolver. */
function createDefaultFilter(map: Record<string, any>) {
  return function (value: FilterKeyType, defaultLabel: string = '') {
    const label = map[value];
    if (!label) {
      return defaultLabel;
    }
    return typeof label === 'object' ? (label.label || defaultLabel) : label;
  };
}

type ListOptions = {
  reverseList?: boolean;
  onWalkListItem?: (item: any, index: number) => any;
  onGetList?: (list: any[]) => any[];
  onSetList?: (list: any[]) => void;
};

/** Builds entries, then sorts stably by explicit order or traversal index. */
function buildFilterList(filter: { map: Record<string, any> }, keys: string[], options: ListOptions) {
  const entries = keys.map((value, index) => {
    let label = filter.map[value];
    const rest: Record<string, any> = {};
    if (label && isPlainObject(label)) {
      const config = label;
      Object.keys(config).forEach(key => {
        if (key === 'label') {
          label = config[key];
        } else {
          rest[key] = config[key];
        }
      });
    }
    const item: Record<string, any> = { value, label, ...rest };
    item.order = typeof item.order === 'number' ? item.order : index;
    const result = options.onWalkListItem ? options.onWalkListItem(item, index) : undefined;
    if (result === false) {
      return undefined;
    }
    const entry = isPlainObject(result) ? result : item;
    entry.order = typeof entry.order === 'number' ? entry.order : index;
    return { entry, index };
  }).filter((item): item is { entry: Record<string, any>; index: number } => !!item);
  entries.sort((a, b) => a.entry.order - b.entry.order || a.index - b.index);
  return entries.map(item => item.entry);
}

/** Installs lazy list access and selection before constants and external methods. */
function installFilterList(filter: any, keys: string[], options: ListOptions) {
  if (options.reverseList) {
    keys.reverse();
  }
  let list: Record<string, any>[];
  defineProperty(filter, 'list', {
    get() {
      if (!list) {
        list = buildFilterList(filter, keys, options);
      }
      return options.onGetList ? options.onGetList(list) : list;
    },
    set(value: Record<string, any>[]) {
      if (options.onSetList) {
        options.onSetList(value);
      }
      list = value;
    },
    configurable: true,
    enumerable: true,
  });
  filter.createList = (values?: any[] | ((item: any, index: number, list: any[]) => unknown)) => {
    const currentList: any[] = filter.list;
    return typeof values === 'function'
      ? currentList.filter(values)
      : currentList.filter(item => !values || values.includes(item.value));
  };
}

/** Queries the first matching entry without calling potentially overridden instance methods. */
function findItem(list: Record<string, any>[], prop: PropertyKey, value: unknown) {
  return list.find(item => item[prop as string] === value);
}

/** Returns a matched property, keeping defined falsy values. */
function itemProp(item: Record<string, any> | undefined, prop: PropertyKey, defaultValue: unknown) {
  const value = item && item[prop as string];
  return value === undefined ? defaultValue : value;
}

/** Optional methods read the current public list once per invocation. */
function mountEnhancements(filter: any) {
  const methods = {
    itemBy: (prop: PropertyKey, value: unknown) => findItem(filter.list, prop, value),
    itemByValue: (value: unknown) => findItem(filter.list, 'value', value),
    itemByLabel: (label: unknown) => findItem(filter.list, 'label', label),
    propBy: (key: unknown, prop: PropertyKey, defaultValue?: unknown) => {
      const list: Record<string, any>[] = filter.list;
      return itemProp(list.find(item => item.value === key || item.label === key), prop, defaultValue);
    },
    propByValue: (value: unknown, prop: PropertyKey, defaultValue?: unknown) => itemProp(findItem(filter.list, 'value', value), prop, defaultValue),
    propByLabel: (label: unknown, prop: PropertyKey, defaultValue?: unknown) => itemProp(findItem(filter.list, 'label', label), prop, defaultValue),
    groupBy: (prop: PropertyKey) => {
      const list: Record<string, any>[] = filter.list;
      const groups = new Map<unknown, Record<string, any>[]>();
      list.forEach(item => {
        const key = item[prop as string];
        const group = groups.get(key);
        if (group) {
          group.push(item);
        } else {
          groups.set(key, [item]);
        }
      });
      return groups;
    },
    labelsByValues: (values: unknown[], options: LabelsByValuesOptions = {}) => {
      const list: Record<string, any>[] = filter.list;
      const labels: string[] = [];
      values.forEach(value => {
        const item = findItem(list, 'value', value);
        if (item || !options.ignoreMissing) {
          labels.push(item ? String(item.label) : '');
        }
      });
      return labels.join(options.separator === undefined ? ',' : options.separator);
    },
  };
  Object.keys(methods).forEach(key => {
    if (!(key in filter)) {
      copyPropertyDescriptors(filter, methods, [key]);
    }
  });
}

/** Mounts enumerable named constants, exposing the effective valueMap. */
function mountValueMap(
  filter: { valueMap: any },
  map: Record<string, any>,
  valueMap: Record<string, any> | null | undefined,
) {
  const values = valueMap || Object.keys(map).reduce((result, key) => {
    if (key) {
      result[key] = key;
    }
    return result;
  }, {} as Record<string, any>);
  filter.valueMap = values;
  copyPropertyDescriptors(filter, values, Object.keys(values).filter(key => !!key));
}

/** Resolves external after the filter is initialized, preserving all own string descriptors. */
function mountExternal<T extends object>(
  filter: T,
  external: Record<string, any> | ((filter: T) => Record<string, any> | null) | undefined,
) {
  if (!external) {
    return;
  }
  const resolved = typeof external === 'function' ? external(filter) : external;
  if (resolved) {
    copyPropertyDescriptors(filter, resolved, Object.getOwnPropertyNames(resolved));
  }
}

/**
 * Creates a callable filter from a map: resolve values to labels, expose `list`, attach valueMap keys and extensions.
 * @param map Mapping from keys to labels or objects with extra fields
 * @param valueMap Optional mapping from keys to stored values; defaults to identity per key
 * @param options Optional custom resolver, list order, `external` methods, and list walk/get/set hooks
 * @returns Callable filter with `list`, `createList`, `map`, `valueMap`, and valueMap keys on the instance
 */
function createFilter<
  T extends Record<string, any>,
  const V extends Record<string, any> | undefined | null = undefined,
  F extends FilterFunc<T, V> = FilterFunc<T, V>,
  E extends Record<string, any> = {},
  W extends void | boolean | Record<string, any> = void,
  L extends Record<string, any> = WalkedItem<T, V, W>,
  A extends boolean = false,
>(
  map: T,
  valueMap: V | undefined,
  options: Omit<CreateFilterOptions<F, E, T, V, W, L, A>, 'external'> & {
    external: ExternalOptions<T, V, F, E, L, WalkedItem<T, V, W>>
        | ((filter: FilterThis<T, V, F, L, WalkedItem<T, V, W>>) => E & ThisType<FilterThis<T, V, F, L, WalkedItem<T, V, W>> & ResolvedExternal<E>> | null);
  },
): EnhancedResult<FilterThis<T, V, F, L, WalkedItem<T, V, W>> & ResolvedExternal<E>, L, A>;
function createFilter<
  T extends Record<string, any>,
  const V extends Record<string, any> | undefined | null = undefined,
  F extends FilterFunc<T, V> = FilterFunc<T, V>,
  E extends Record<string, any> = {},
  W extends void | boolean | Record<string, any> = void,
  L extends Record<string, any> = WalkedItem<T, V, W>,
  A extends boolean = false,
>(
  map: T,
  valueMap?: V,
  options?: CreateFilterOptions<F, E, T, V, W, L, A>,
): EnhancedResult<FilterThis<T, V, F, L, WalkedItem<T, V, W>> & ResolvedExternal<E>, L, A>;
function createFilter<
  T extends Record<string, any>,
  const V extends Record<string, any> | undefined | null = undefined,
  F extends FilterFunc<T, V> = FilterFunc<T, V>,
  E extends Record<string, any> = {},
  W extends void | boolean | Record<string, any> = void,
  L extends Record<string, any> = WalkedItem<T, V, W>,
  A extends boolean = false,
>(
  map: T,
  valueMap?: V,
  options: CreateFilterOptions<F, E, T, V, W, L, A> = {},
): EnhancedResult<FilterThis<T, V, F, L, WalkedItem<T, V, W>> & ResolvedExternal<E>, L, A> {
  type FilterType = FilterThis<T, V, F, L, WalkedItem<T, V, W>> & ResolvedExternal<E>;
  const filter = (options.filter || createDefaultFilter(map)) as FilterType;
  filter.map = map;
  filter.valueMap = valueMap as FilterType['valueMap'];
  installFilterList(filter, Object.keys(map), options);
  mountValueMap(filter, map, valueMap);
  mountExternal(filter, options.external);
  if (options.enhance) {
    mountEnhancements(filter);
  }
  innumerable(filter, REACT_FILTER_KEY, true);
  innumerable(filter, REACT_FILTER_DEFAULT_FILTER, !options.filter);
  return filter as EnhancedResult<FilterType, L, A>;
}


export {
  FilterKeyType,
  LabelsByValuesOptions,
  EnhancedMethods,
  CreateFilterOptions,
  ExternalFactoryBrand,
  ExternalFactoryFn,
  FilterListItem,
  FilterValueMap,
  FilterThis,
  ExternalOptions,
  FilterEx as Filter,

  isFilter,
  isDefaultFilter,
  createFilterMap,
  createExternalFactory,
  createFilter,
};

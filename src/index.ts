
import { isPlainObject, innumerable } from './utils';

const REACT_FILTER_PREFIX = 'react-filter-utils:';
const REACT_FILTER_KEY = `${REACT_FILTER_PREFIX}filter`;
const REACT_FILTER_DEFAULT_FILTER = `${REACT_FILTER_PREFIX}default-filter`;

type FilterKeyType = string|number;

type FilterEx<T extends Record<string, any>, V, F> = Filter<T, V, F> & {
  [key: string]: any;
}


type CreateFilterOptions<F extends Function, E, T extends Record<string, any>, V> = {
  reverseList?: boolean,
  filter?: F,
  external?: { [key in keyof E]: E[key] }
   |((this: FilterEx<T, V, F>, filter: FilterEx<T, V, F>) => { [key in keyof E]: E[key] }),
  onWalkListItem?: (item: FilterListItem<T, V>, index: number) => void|boolean|Record<string, any>,
  onGetList?: (list: FilterListItem<T, V>[]) => FilterListItem<T, V>[],
  onSetList?: (list: FilterListItem<T, V>[]) => void,
}


type FilterListItem<T, V> = {
  value: V extends Record<string, infer U> ? U : keyof T;
  label: string;
  order?: number;
} & (
  T[keyof T] extends Record<string, any>
    ? T[keyof T]
    : {}
)


type FilterFunc<T extends Record<string, any>, V> = (
  value: V extends Record<string, infer U> ? U : keyof T,
  defaultLabel?: string
) => string;

interface Filter<T extends Record<string, any>, V, F> {
  (...args: Parameters<F extends FilterFunc<T, V> ? F : FilterFunc<T, V>>): string;

  list: FilterListItem<T, V>[];
  createList(values: string[]): FilterListItem<T, V>[];
  map: T,
  valueMap: V,
}

function isFilter(v: any): v is Filter<any, any, any> {
  return v && v[REACT_FILTER_KEY] === true;
}
function isDefaultFilter(v: any): v is Filter<any, any, any> {
  return isFilter(v) && (v as any)[REACT_FILTER_DEFAULT_FILTER] === true;
}

function createFilterMap<T extends Record<string, string|{
  label: string,
  order?: number,
}>>(map: T): T {
  return map;
}

function createFilter<
  T extends Record<string, any>,
  V extends Record<string, any>|undefined|null,
  E extends Record<string, any>|undefined|null,
  F extends FilterFunc<T, V>
>(
  map: T,
  valueMap?: V,
  options: CreateFilterOptions<F, E, T, V> = {}
) {
  type MapType = V extends Record<string, any>
  ? { readonly [key in keyof V]: V[key] }
  : { readonly [key in keyof T]: key };

  type FilterType = Filter<T, V, F> & MapType & { [key in keyof E]: E[key] };

  const filter: FilterType = (options.filter || function (value: FilterKeyType, defaultLabel: string = '') {
    let label = (map as Record<string, any>)[value as any];
    if (!label) return defaultLabel;
    return typeof label === 'object' ? (label.label || defaultLabel) : label;
  }) as any;

  (filter as any).map = map;
  (filter as any).valueMap = valueMap;

  let keys = Object.keys(map);
  if (options.reverseList) keys = keys.reverse();

  const _createList = () => {
    let hasOrder: null|boolean = null;
    const list: FilterListItem<T, V>[] = keys.map((value: string, index: number) => {
      let label = filter.map[value];
      const rest: FilterListItem<T, V> = {} as any;
      if (label && isPlainObject(label)) {
        const labelObj = label;
        Object.keys(labelObj).forEach(key => {
          if (key === 'label') label = labelObj[key];
          else (rest as any)[key] = labelObj[key];
        });
      }
      const item = { value, label: (label as any), ...(rest as any) };
      const isContinue = options.onWalkListItem && options.onWalkListItem(item as any, index);
      if (isContinue === false) return;
      let ret = isPlainObject(isContinue) ? isContinue : item;
      if (hasOrder === null) {
        hasOrder = typeof ret.order === 'number';
      }
      return ret;
    }).filter(Boolean);
    if (hasOrder) {
      list.sort((a, b) => (a.order  || 0) - (b.order  || 0));
    }
    return list;
  };

  let _list: ReturnType<typeof _createList>;
  Object.defineProperty((filter as any), 'list', {
    get() {
      if (!_list) _list = _createList();
      return options.onGetList ? options.onGetList(_list) : _list;
    },
    set(v) {
      if (options.onSetList) options.onSetList(v);
      _list = v;
    },
    configurable: true,
    enumerable: true,
  });

  const createList = function (values?: FilterKeyType[]) {
    return filter.list.filter(v => !values || values.includes((v as any).value));
  };

  (filter as any).createList = createList;

  if (!valueMap) {
    valueMap = Object.keys(map).reduce((p, key) => {
      if (key) p[key] = key;
      return p;
    }, {} as Record<string, any>) as any;
  }

  Object.keys((valueMap as Record<string, any>)).forEach(key => {
    if (!key) return;
    const d = Object.getOwnPropertyDescriptor(valueMap, key);
    if (d) Object.defineProperty(filter, key, d);
  });

  let external = options.external;
  if (external) {
    if (typeof external === 'function') external = external.call(filter, filter);
    if (external) {
      Object.getOwnPropertyNames(external).forEach(key => {
        const d = Object.getOwnPropertyDescriptor(external, key);
        d && Object.defineProperty(filter, key, d);
      });
    }
  }

  innumerable(filter, REACT_FILTER_KEY, true);
  innumerable(filter, REACT_FILTER_DEFAULT_FILTER, !options.filter);

  return filter;
}


export {
  FilterKeyType,
  CreateFilterOptions,
  FilterListItem,
  FilterEx as Filter,

  isFilter,
  isDefaultFilter,
  createFilterMap,
  createFilter,
};

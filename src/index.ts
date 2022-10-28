
import { isPlainObject } from './utils';

type FilterKeyType = string|number;

type FilterEx<T extends Record<string, any>, V, F> = Filter<T, V, F> & {
  [key: string]: any;
}


type CreateFilterOptions<F extends Function, E, T extends Record<string, any>, V> = {
  filter?: F;
  external?: { [key in keyof E]: E[key] }
   |((this: FilterEx<T, V, F>, filter: FilterEx<T, V, F>) => { [key in keyof E]: E[key] }),
  onWalkListItem?: (item: FilterListItem<T, V>, index: number) => void|boolean|Record<string, any>;
}


type FilterListItem<T, V> = {
  value: V extends Record<string, infer U> ? U : keyof T;
  label: string;
} & (
  T[keyof T] extends Record<string, any>
    ? T[keyof T]
    : {}
)


type FilterFunc<T extends Record<string, any>, V> = (value: V extends Record<string, infer U> ? U : keyof T) => string;

interface Filter<T extends Record<string, any>, V, F> {
  (...args: Parameters<F extends FilterFunc<T, V> ? F : FilterFunc<T, V>>): string;

  list: FilterListItem<T, V>[];
  createList(values: string[]): FilterListItem<T, V>[];
  map: T
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
  const list = Object.keys(map).map((value: string, index: number) => {
    let label = map[value];
    const rest: Record<string, any> = {};
    if (label && isPlainObject(label)) {
      const labelObj = label;
      Object.keys(labelObj).forEach(key => {
        if (key === 'label') label = labelObj[key];
        else rest[key] = labelObj[key];
      });
    }
    const item = { value, label: (label as any), ...rest };
    const isContinue = options.onWalkListItem && options.onWalkListItem(item as any, index);
    if (isContinue === false) return;
    return isPlainObject(isContinue) ? isContinue : item;
  }).filter(Boolean);

  const createList = function (values?: FilterKeyType[]) {
    return list.filter(v => !values || values.includes((v as any).value));
  };

  type MapType = V extends Record<string, any>
    ? { [key in keyof V]: V[key] }
    : { [key in keyof T]: key };

  type FilterType = Filter<T, V, F> & MapType & { [key in keyof E]: E[key] };

  const filter: FilterType = (options.filter || function (value: FilterKeyType) {
    let label = (map as Record<string, any>)[value as any];
    if (!label) return '';
    return typeof label === 'object' ? label.label : label;
  }) as any;

  (filter as any).list = list;
  (filter as any).createList = createList;
  (filter as any).map = map;

  if (!valueMap) {
    valueMap = Object.keys(map).reduce((p, key) => {
      if (key) p[key] = key;
      return p;
    }, {} as Record<string, any>) as any;
  }

  Object.keys((valueMap as Record<string, any>)).forEach(key => {
    if (!key) return;
    (filter as any)[key] = (valueMap as Record<string, any>)[key];
  });

  let external = options.external;
  if (external) {
    if (typeof external === 'function') external = external.call(filter, filter);
    external && Object.assign(filter, external);
  }

  return filter;
}


export {
  FilterKeyType,
  CreateFilterOptions,
  FilterListItem,
  FilterEx as Filter,

  createFilter,
};

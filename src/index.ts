
export type FilterKeyType = string|number;

export type CreateFilterMap<T extends Record<string, any>> = {
  [key in keyof T]: T[key]
}

export type CreateFilterValueMap<T> = {
  [key in keyof T]: T[key]
}

export type CreateFilterOptions<E> = {
  filter?: (value: FilterKeyType, ...args: any[]) => string;
  external?: { [key in keyof E]: E[key] }
   |((this: FilterEx, filter: FilterEx) => { [key in keyof E]: E[key] })
}

export interface FilterListItem<T extends FilterKeyType = FilterKeyType> {
  value: T;
  label: string;
}
 interface Filter {
  (value: FilterKeyType): string;

  list: FilterListItem[];
  createList(values: string[]): FilterListItem[];
}

interface FilterEx extends Filter {
  [key: string]: any;
}

function createFilter<T extends Partial<any>, V, E extends Record<string, any>>(
  map: CreateFilterMap<T>,
  valueMap?: CreateFilterValueMap<V>,
  options: CreateFilterOptions<E> = {}
) {
  const list = Object.keys(map).map((value: string) => {
    let label = map[value as any];
    let rest: Partial<any> = {};
    if (label && typeof label === 'object') {
      let labelObj = label as Partial<any>;
      Object.keys(labelObj).forEach(key => {
        if (key === 'label') label = labelObj[key];
        else rest[key] = labelObj[key];
      });
    }
    return { value, label: (label as any), ...rest };
  });

  const createList = function (values: FilterKeyType[]) {
    return list.filter(v => values.includes(v.value));
  };

  type MapType = V extends Record<string, any>
    ? { [key in keyof V]: V[key] }
    : { [key in keyof T]: T[key] };

  type FilterType = Filter & MapType & { [key in keyof E]: E[key] };

  const filter: FilterType = (options.filter || function (value: FilterKeyType) {
    let label = map[value as any];
    if (!label) return '';
    return typeof label === 'object' ? label.label : label;
  }) as any;

  (filter as any).list = list;
  (filter as any).createList = createList;

  if (valueMap) {
    valueMap = Object.keys(valueMap).reduce((p: any, key: string) => {
      p[(valueMap as any)[key]] = key;
      return p;
    }, {}) as any;
  }
  Object.keys(map).forEach(value => {
    if (!value) return;
    const key = valueMap ? (valueMap as any)[value] : value;
    if (key === undefined) return;
    (filter as any)[key] = value;
  });

  let external = options.external;
  if (external) {
    if (typeof external === 'function') external = external.call(filter, filter);
    external && Object.assign(filter, external);
  }

  return filter;
}

export {
  FilterEx as Filter,

  createFilter,
};

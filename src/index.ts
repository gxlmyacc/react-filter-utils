
type FilterKeyType = string|number;

type FilterMap<T extends Partial<any>> = {
  [key in keyof T]: T[key]
}

type FilterValueMap<T extends Partial<any>> = {
  [key in keyof T]: T[key]
}

type FilterOptions<E> = {
  filter?: (value: FilterKeyType) => string;
  external?: { [key in keyof E]: E[key] }
   |((filter: Filter) => { [key in keyof E]: E[key] })
}

interface Filter {
  (value: FilterKeyType): string;

  list: { value: FilterKeyType; label: string; }[];
  createList(values: string[]): { value: FilterKeyType; label: string; }[];
}

function createFilter<T extends Partial<any>, V, E extends Partial<any>>(
  map: FilterMap<T>,
  valueMap?: FilterValueMap<V>,
  options: FilterOptions<E> = {}
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

  type MapType = V extends Partial<any>
    ? { [key in keyof V]: V[key] }
    : { [key in keyof T]: T[key] };

  const filter: Filter
    & MapType
    & { [key in keyof E]: E[key] }
     = (options.filter || function (value: FilterKeyType) {
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
    const key = valueMap && /^\d+$/.test(value) ? (valueMap as any)[value] : value;
    if (key === undefined) return;
    (filter as any)[key] = value;
  });

  let external = options.external;
  if (external) {
    if (typeof external === 'function') external = external(filter);
    external && Object.assign(filter, external);
  }

  return filter;
}

export {
  createFilter,
};

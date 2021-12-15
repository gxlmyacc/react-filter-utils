
type FilterKeyType = string|number;

type FilterMap<T extends Partial<any>> = {
  [P in keyof T]: T[P]
}

type FilterValueMap = {
  [key: string]: string;
}

type FilterOptions = {
  filter?: (value: FilterKeyType) => string;
}

interface Filter {
  (value: FilterKeyType): string;

  list: { value: FilterKeyType; label: string; }[];
  createList(values: string[]): { value: FilterKeyType; label: string; }[];
}


function createFilter<T extends Partial<any> = {}, E extends Partial<any> = {}>(
  map: FilterMap<T>,
  valueMap: FilterValueMap = {},
  options: FilterOptions = {}
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

  const filter: Filter & {
    [P in keyof T]: T[P]
  } & {
    [P in keyof E]: E[P]
  } = (options.filter || function (value: FilterKeyType) {
    let label = map[value as any];
    if (!label) return '';
    return typeof label === 'object' ? label.label : label;
  }) as any;

  (filter as any).list = list;
  (filter as any).createList = createList;

  Object.keys(map).forEach(value => {
    if (!value) return;
    const key = /^\d+$/.test(value) ? valueMap[value] : value;
    if (key === undefined) return;
    (filter as any)[key] = value;
  });

  return filter;
}

export {
  createFilter,
};

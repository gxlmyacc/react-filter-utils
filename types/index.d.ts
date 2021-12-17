declare type FilterKeyType = string | number;
declare type FilterMap<T extends Partial<any>> = {
    [key in keyof T]: T[key];
};
declare type FilterValueMap<T extends Partial<any>> = {
    [key in keyof T]: T[key];
};
declare type FilterOptions<E> = {
    filter?: (value: FilterKeyType, ...args: any[]) => string;
    external?: {
        [key in keyof E]: E[key];
    } | ((this: FilterEx, filter: FilterEx) => {
        [key in keyof E]: E[key];
    });
};
interface Filter {
    (value: FilterKeyType): string;
    list: {
        value: FilterKeyType;
        label: string;
    }[];
    createList(values: string[]): {
        value: FilterKeyType;
        label: string;
    }[];
}
interface FilterEx extends Filter {
    [key: string]: any;
}
declare function createFilter<T extends Partial<any>, V, E extends Partial<any>>(map: FilterMap<T>, valueMap?: FilterValueMap<V>, options?: FilterOptions<E>): Filter & (V extends Partial<any> ? { [key in keyof V]: V[key]; } : { [key_1 in keyof T]: T[key_1]; }) & { [key_2 in keyof E]: E[key_2]; };
export { createFilter, };

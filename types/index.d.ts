type FilterKeyType = string | number;
type FilterEx<T extends Record<string, any>, V, F> = Filter<T, V, F> & {
    [key: string]: any;
};
type CreateFilterOptions<F extends Function, E, T extends Record<string, any>, V> = {
    reverseList?: boolean;
    filter?: F;
    external?: {
        [key in keyof E]: E[key];
    } | ((this: FilterEx<T, V, F>, filter: FilterEx<T, V, F>) => {
        [key in keyof E]: E[key];
    });
    onWalkListItem?: (item: FilterListItem<T, V>, index: number) => void | boolean | Record<string, any>;
    onGetList?: (list: FilterListItem<T, V>[]) => FilterListItem<T, V>[];
    onSetList?: (list: FilterListItem<T, V>[]) => void;
};
type FilterListItem<T, V> = {
    value: V extends Record<string, infer U> ? U : keyof T;
    label: string;
    order?: number;
} & (T[keyof T] extends Record<string, any> ? T[keyof T] : {});
type FilterFunc<T extends Record<string, any>, V> = (value: V extends Record<string, infer U> ? U : keyof T, defaultLabel?: string) => string;
interface Filter<T extends Record<string, any>, V, F> {
    (...args: Parameters<F extends FilterFunc<T, V> ? F : FilterFunc<T, V>>): string;
    list: FilterListItem<T, V>[];
    createList(values: string[]): FilterListItem<T, V>[];
    map: T;
    valueMap: V;
}
declare function isFilter(v: any): v is Filter<any, any, any>;
declare function isDefaultFilter(v: any): v is Filter<any, any, any>;
declare function createFilterMap<T extends Record<string, string | {
    label: string;
    order?: number;
}>>(map: T): T;
declare function createFilter<T extends Record<string, any>, V extends Record<string, any> | undefined | null, E extends Record<string, any> | undefined | null, F extends FilterFunc<T, V>>(map: T, valueMap?: V, options?: CreateFilterOptions<F, E, T, V>): Filter<T, V, F> & (V extends Record<string, any> ? V extends infer T_1 extends Record<string, any> ? { readonly [key in keyof T_1]: V[key]; } : never : { readonly [key_1 in keyof T]: key_1; }) & { [key_2 in keyof E]: E[key_2]; };
export { FilterKeyType, CreateFilterOptions, FilterListItem, FilterEx as Filter, isFilter, isDefaultFilter, createFilterMap, createFilter, };

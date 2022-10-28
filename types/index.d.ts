declare type FilterKeyType = string | number;
declare type FilterEx<T extends Record<string, any>, V, F> = Filter<T, V, F> & {
    [key: string]: any;
};
declare type CreateFilterOptions<F extends Function, E, T extends Record<string, any>, V> = {
    filter?: F;
    external?: {
        [key in keyof E]: E[key];
    } | ((this: FilterEx<T, V, F>, filter: FilterEx<T, V, F>) => {
        [key in keyof E]: E[key];
    });
    onWalkListItem?: (item: FilterListItem<T, V>, index: number) => void | boolean | Record<string, any>;
};
declare type FilterListItem<T, V> = {
    value: V extends Record<string, infer U> ? U : keyof T;
    label: string;
} & (T[keyof T] extends Record<string, any> ? T[keyof T] : {});
declare type FilterFunc<T extends Record<string, any>, V> = (value: V extends Record<string, infer U> ? U : keyof T) => string;
interface Filter<T extends Record<string, any>, V, F> {
    (...args: Parameters<F extends FilterFunc<T, V> ? F : FilterFunc<T, V>>): string;
    list: FilterListItem<T, V>[];
    createList(values: string[]): FilterListItem<T, V>[];
    map: T;
}
declare function createFilter<T extends Record<string, any>, V extends Record<string, any> | undefined | null, E extends Record<string, any> | undefined | null, F extends FilterFunc<T, V>>(map: T, valueMap?: V, options?: CreateFilterOptions<F, E, T, V>): Filter<T, V, F> & (V extends Record<string, any> ? { [key in keyof V]: V[key]; } : { [key_1 in keyof T]: key_1; }) & { [key_2 in keyof E]: E[key_2]; };
export { FilterKeyType, CreateFilterOptions, FilterListItem, FilterEx as Filter, createFilter, };

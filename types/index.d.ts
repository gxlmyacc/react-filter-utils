export declare type FilterKeyType = string | number;
export declare type CreateFilterMap<T extends Record<string, any>> = {
    [key in keyof T]: T[key];
};
export declare type CreateFilterValueMap<T extends Record<string, any>> = {
    [key in keyof T]: T[key];
};
export declare type CreateFilterOptions<E> = {
    filter?: (value: FilterKeyType, ...args: any[]) => string;
    external?: {
        [key in keyof E]: E[key];
    } | ((this: FilterEx, filter: FilterEx) => {
        [key in keyof E]: E[key];
    });
};
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
declare function createFilter<T extends Record<string, any>, V extends Record<string, any>, E extends Record<string, any>>(map: CreateFilterMap<T>, valueMap?: CreateFilterValueMap<V>, options?: CreateFilterOptions<E>): Filter & (V extends Partial<any> ? { [key in keyof V]: V[key]; } : { [key_1 in keyof T]: T[key_1]; }) & { [key_2 in keyof E]: E[key_2]; };
export { FilterEx as Filter, createFilter, };

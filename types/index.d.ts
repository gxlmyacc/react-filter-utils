declare type FilterKeyType = string | number;
declare type FilterMap<T extends Partial<any>> = {
    [key in keyof T]: T[key];
};
declare type FilterValueMap<T extends Partial<any>> = {
    [key in keyof T]: T[key];
};
declare type FilterOptions<E> = {
    filter?: (value: FilterKeyType) => string;
    external?: {
        [key in keyof E]: E[key];
    } | ((filter: Filter) => {
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
declare function createFilter<T extends Partial<any>, V extends Partial<any>, E extends Partial<any>>(map: FilterMap<T>, valueMap?: FilterValueMap<V>, options?: FilterOptions<E>): Filter & (FilterValueMap<V> | undefined extends null ? { [key in keyof T]: T[key]; } : FilterValueMap<V> | undefined extends undefined ? { [key_1 in keyof T]: T[key_1]; } : { [key_2 in keyof V]: V[key_2]; }) & { [key_3 in keyof E]: E[key_3]; };
export { createFilter, };

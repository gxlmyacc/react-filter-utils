declare type FilterKeyType = string | number;
declare type FilterMap<T extends Partial<any>> = {
    [P in keyof T]: T[P];
};
declare type FilterValueMap = {
    [key: string]: string;
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
declare function createFilter<T extends Partial<any> = {}, E extends Partial<any> = {}>(map: FilterMap<T>, valueMap?: FilterValueMap, options?: FilterOptions<E>): Filter & { [P in keyof T]: T[P]; } & { [P_1 in keyof E]: E[P_1]; };
export { createFilter, };

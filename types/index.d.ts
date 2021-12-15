declare type FilterKeyType = string | number;
declare type FilterMap<T extends Partial<any>> = {
    [P in keyof T]: T[P];
};
declare type FilterValueMap = {
    [key: string]: string;
};
declare type FilterOptions = {
    filter?: (value: FilterKeyType) => string;
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
declare function createFilter<T extends Partial<any> = {}, E extends Partial<any> = {}>(map: FilterMap<T>, valueMap?: FilterValueMap, options?: FilterOptions): Filter & { [P in keyof T]: T[P]; } & { [P_1 in keyof E]: E[P_1]; };
export { createFilter, };

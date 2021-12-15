declare type FilterKeyType = string | number;
declare type FilterMap<T extends Partial<any>> = {
    [key in keyof T]: FilterKeyType | {
        label: any;
    };
};
declare type FilterValueMap = {
    [key: string]: string;
};
declare type FilterOptions = {
    filter?: (value: FilterKeyType) => string;
};
interface Filter {
    (value: FilterKeyType): string;
}
declare function createFilter<T extends Partial<any> = {}, E extends Object = {}>(map: FilterMap<T>, valueMap?: FilterValueMap, options?: FilterOptions): Filter | {
    list: {
        value: FilterKeyType;
        label: string;
    }[];
    createList(values: string[]): {
        value: FilterKeyType;
        label: string;
    }[];
} | { [key in keyof T]: string; } | { [key_1 in keyof E]: any; };
export { createFilter, };

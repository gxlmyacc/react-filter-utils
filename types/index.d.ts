type FilterKeyType = string | number;
/** valueMap keys mounted on the filter instance */
type FilterValueMap<T extends Record<string, any>, V> = V extends Record<string, any> ? {
    readonly [key in keyof V]: V[key];
} : {
    readonly [key in keyof T]: key;
};
/** Filter instance shape available as `this` inside `external` methods */
type FilterThis<T extends Record<string, any>, V, F extends FilterFunc<T, V> = FilterFunc<T, V>> = Filter<T, V, F> & FilterValueMap<T, V>;
type FilterEx<T extends Record<string, any>, V, F> = FilterThis<T, V, F extends FilterFunc<T, V> ? F : FilterFunc<T, V>> & {
    [key: string]: any;
};
type ExternalOptions<T extends Record<string, any>, V, F extends FilterFunc<T, V>, E extends Record<string, any>> = E & ThisType<FilterThis<T, V, F> & E>;
/** Carries inferred external method types from `createExternalFactory` into `createFilter`. */
type ExternalFactoryBrand<E extends Record<string, any>> = {
    readonly __externalMethods?: E;
};
type ExternalFactoryFn<T extends Record<string, any>, V, F extends FilterFunc<T, V>, E extends Record<string, any>> = ((filter: FilterThis<T, V, F>) => E) & ExternalFactoryBrand<E>;
type CreateFilterOptions<F extends FilterFunc<T, V>, E extends Record<string, any>, T extends Record<string, any>, V> = {
    reverseList?: boolean;
    filter?: F;
    external?: ExternalOptions<T, V, F, E> | ExternalFactoryFn<T, V, F, E> | ((filter: FilterThis<T, V, F>) => ExternalOptions<T, V, F, E> | null);
    onWalkListItem?: (item: FilterListItem<T, V>, index: number) => void | boolean | Record<string, any>;
    onGetList?: (list: FilterListItem<T, V>[]) => FilterListItem<T, V>[];
    onSetList?: (list: FilterListItem<T, V>[]) => void;
};
/**
 * Wraps an `external` factory so returned methods get `this` typed via `ThisType` (infers `E` from the object).
 * @param factory Receives the filter instance; returned methods may use `this.list`, valueMap keys, etc.
 * @returns Factory suitable for `createFilter(..., { external })`
 */
declare function createExternalFactory<T extends Record<string, any>, V, E extends Record<string, any>, F extends FilterFunc<T, V> = FilterFunc<T, V>>(factory: (filter: FilterThis<T, V, F>) => ExternalOptions<T, V, F, E>): ExternalFactoryFn<T, V, F, E>;
type FilterListItem<T, V> = {
    value: V extends Record<string, infer U> ? U : keyof T;
    label: string;
    order?: number;
} & (T[keyof T] extends Record<string, any> ? T[keyof T] : {});
type FilterFunc<T extends Record<string, any>, V> = (value: V extends Record<string, infer U> ? U : keyof T, defaultLabel?: string) => string;
interface Filter<T extends Record<string, any>, V, F> {
    (...args: Parameters<F extends FilterFunc<T, V> ? F : FilterFunc<T, V>>): string;
    list: FilterListItem<T, V>[];
    createList(values?: string[]): FilterListItem<T, V>[];
    map: T;
    valueMap: V;
}
/**
 * Returns whether `v` is a filter instance created by `createFilter`.
 * @param v Value to test
 * @returns `true` if the internal filter marker is present
 */
declare function isFilter(v: any): v is Filter<any, any, any>;
/**
 * Returns whether the filter uses the default label resolver (no custom `options.filter`).
 * @param v Value to test
 * @returns `true` when `isFilter(v)` and the default resolver is in use
 */
declare function isDefaultFilter(v: any): v is Filter<any, any, any>;
/**
 * Helper to define a filter map with stricter literal type inference in TypeScript.
 * @param map Mapping from keys to display labels or `{ label, order?, ... }` objects
 * @returns The same `map` reference
 */
declare function createFilterMap<T extends Record<string, string | {
    label: string;
    order?: number;
}>>(map: T): T;
/**
 * Creates a callable filter from a map: resolve values to labels, expose `list`, attach valueMap keys and extensions.
 * @param map Mapping from keys to labels or objects with extra fields
 * @param valueMap Optional mapping from keys to stored values; defaults to identity per key
 * @param options Optional custom resolver, list order, `external` methods, and list walk/get/set hooks
 * @returns Callable filter with `list`, `createList`, `map`, `valueMap`, and valueMap keys on the instance
 */
declare function createFilter<T extends Record<string, any>, V extends Record<string, any> | undefined | null, F extends FilterFunc<T, V>, E extends Record<string, any>>(map: T, valueMap: V | undefined, options: Omit<CreateFilterOptions<F, E, T, V>, 'external'> & {
    external: ExternalOptions<T, V, F, E> | ExternalFactoryFn<T, V, F, E> | ((filter: FilterThis<T, V, F>) => ExternalOptions<T, V, F, E> | null);
}): FilterThis<T, V, F> & E;
declare function createFilter<T extends Record<string, any>, V extends Record<string, any> | undefined | null, F extends FilterFunc<T, V> = FilterFunc<T, V>>(map: T, valueMap?: V, options?: CreateFilterOptions<F, {}, T, V>): FilterThis<T, V, F>;
export { FilterKeyType, CreateFilterOptions, ExternalFactoryBrand, ExternalFactoryFn, FilterListItem, FilterValueMap, FilterThis, ExternalOptions, FilterEx as Filter, isFilter, isDefaultFilter, createFilterMap, createExternalFactory, createFilter, };

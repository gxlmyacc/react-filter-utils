type FilterKeyType = string | number;
/** valueMap keys mounted on the filter instance */
type FilterValueMap<T extends Record<string, any>, V> = V extends Record<string, any> ? {
    readonly [key in keyof V]: V[key];
} : {
    readonly [key in keyof T as key extends "" ? never : key extends string | number ? key : never]: key extends string | number ? `${key}` : never;
};
/** Filter instance shape available as `this` inside `external` methods */
type FilterThis<T extends Record<string, any>, V, F extends FilterFunc<T, V> = FilterFunc<T, V>, L extends Record<string, any> = FilterListItem<T, V>, C extends Record<string, any> = L> = Filter<T, V, F, L, C> & FilterValueMap<T, V> & Omit<F, keyof Filter<T, V, F, L, C> | keyof FilterValueMap<T, V>>;
type FilterEx<T extends Record<string, any>, V, F, L extends Record<string, any> = FilterListItem<T, V>, C extends Record<string, any> = L> = FilterThis<T, V, F extends FilterFunc<T, V> ? F : FilterFunc<T, V>, L, C> & {
    [key: string]: any;
};
type ExternalOptions<T extends Record<string, any>, V, F extends FilterFunc<T, V>, E extends Record<string, any>, L extends Record<string, any> = FilterListItem<T, V>, C extends Record<string, any> = L> = E & ThisType<FilterThis<T, V, F, L, C> & ResolvedExternal<E>>;
/** Carries inferred external method types from `createExternalFactory` into `createFilter`. */
type ExternalFactoryBrand<E extends Record<string, any>> = {
    readonly __externalMethods?: E;
};
type ExternalFactoryFn<T extends Record<string, any>, V, F extends FilterFunc<T, V>, E extends Record<string, any>, L extends Record<string, any> = FilterListItem<T, V>, C extends Record<string, any> = L> = ((filter: FilterThis<T, V, F, L, C>) => E) & ExternalFactoryBrand<E>;
type CreateFilterOptions<F extends FilterFunc<T, V>, E extends Record<string, any>, T extends Record<string, any>, V, W extends void | boolean | Record<string, any> = void, L extends Record<string, any> = WalkedItem<T, V, W>, A extends boolean = false> = {
    /** Install optional queries after constants and external; occupied names are skipped. */
    enhance?: A;
    reverseList?: boolean;
    filter?: F;
    external?: (E & ThisType<FilterThis<T, V, F, L, WalkedItem<T, V, W>> & ResolvedExternal<E>>) | ((filter: FilterThis<T, V, F, L, WalkedItem<T, V, W>>) => E & ThisType<FilterThis<T, V, F, L, WalkedItem<T, V, W>> & ResolvedExternal<E>> | null);
    /** false skips, object replaces, boolean/void otherwise keeps the generated entry. */
    onWalkListItem?: (item: FilterListItem<T, V>, index: number) => W;
    /** Transforms cached entries on each read; its result defines the public list type. */
    onGetList?: (list: WalkedItem<T, V, W>[]) => L[];
    /** Receives the cached (walked) shape on assignment, before onGetList. */
    onSetList?: (list: WalkedItem<T, V, W>[]) => void;
};
/**
 * Wraps an `external` factory so returned methods get `this` typed via `ThisType` (infers `E` from the object).
 * @param factory Receives the filter instance; returned methods may use `this.list`, valueMap keys, etc.
 * @returns Factory suitable for `createFilter(..., { external })`
 */
declare function createExternalFactory<T extends Record<string, any>, V, E extends Record<string, any>, F extends FilterFunc<T, V> = FilterFunc<T, V>>(factory: (filter: FilterThis<T, V, F>) => ExternalOptions<T, V, F, E>): ExternalFactoryFn<T, V, F, E>;
/** A list entry uses its own value, falling back to the stringified map key. */
type FilterListEntry<Item, Key extends string> = {
    value: Item extends object ? 'value' extends keyof Item ? Item['value'] | ({} extends Pick<Item, 'value'> ? Key : never) : Key : Key;
    label: string;
    order: Item extends {
        order: infer O extends number;
    } ? O : number;
} & (Item extends object ? Omit<Item, 'value' | 'order'> : {});
/** V is retained for compatibility; valueMap only controls instance constants. */
type FilterListItem<T, V> = {
    [Key in Extract<keyof T, string | number>]: FilterListEntry<T[Key], `${Key}`>;
}[Extract<keyof T, string | number>];
/** Object returns replace entries; boolean/void returns retain the generated shape. */
type OrderedItem<I> = I extends object ? Omit<I, 'order'> & {
    order: I extends {
        order: infer O extends number;
    } ? O : number;
} : never;
type WalkedItem<T, V, W> = OrderedItem<Extract<W, Record<string, any>>> | ([Extract<W, boolean | void>] extends [never] ? never : FilterListItem<T, V>);
type ResolvedExternal<E> = E extends (...args: any[]) => infer R ? NonNullable<R> : E;
/** Formatting for labelsByValues; missing values occupy empty slots by default. */
type LabelsByValuesOptions = {
    /** Joining delimiter, default comma. */
    separator?: string;
    /** Skip unmatched values instead of keeping empty slots, default false. */
    ignoreMissing?: boolean;
};
type ItemKeys<L> = L extends unknown ? keyof L : never;
type ItemProp<L, P extends PropertyKey> = L extends unknown ? P extends keyof L ? L[P] : undefined : never;
type EnhancedMethods<L extends Record<string, any>> = {
    /** Strict equality, first match from the current list. */
    itemBy<P extends ItemKeys<L>>(prop: P, propValue: ItemProp<L, P>): L | undefined;
    itemByValue(value: L['value']): L | undefined;
    itemByLabel(label: L['label']): L | undefined;
    /** New Map and arrays, preserving current item references and insertion order. */
    groupBy<P extends ItemKeys<L>>(prop: P): Map<ItemProp<L, P>, L[]>;
    /** First value-or-label match; undefined fields use the supplied default. */
    propBy<P extends ItemKeys<L>, D = undefined>(key: L['value'] | L['label'], prop: P, defaultValue?: D): Exclude<ItemProp<L, P>, undefined> | D;
    propByValue<P extends ItemKeys<L>, D = undefined>(value: L['value'], prop: P, defaultValue?: D): Exclude<ItemProp<L, P>, undefined> | D;
    propByLabel<P extends ItemKeys<L>, D = undefined>(label: L['label'], prop: P, defaultValue?: D): Exclude<ItemProp<L, P>, undefined> | D;
    /** Input order and duplicates are preserved; defaults to comma and empty missing slots. */
    labelsByValues(values: L['value'][], options?: LabelsByValuesOptions): string;
};
type EnhancedResult<B, L extends Record<string, any>, A extends boolean> = B & ([
    A
] extends [true] ? Omit<EnhancedMethods<L>, keyof B> : boolean extends A ? Partial<Omit<EnhancedMethods<L>, keyof B>> : {});
type FilterFunc<T extends Record<string, any>, V> = (value: V extends Record<string, infer U> ? U : keyof T, defaultLabel?: string) => string;
interface Filter<T extends Record<string, any>, V, F, L extends Record<string, any> = FilterListItem<T, V>, C extends Record<string, any> = L> {
    (...args: Parameters<F extends FilterFunc<T, V> ? F : FilterFunc<T, V>>): string;
    get list(): L[];
    set list(value: C[]);
    createList<S extends L>(predicate: (item: L, index: number, list: L[]) => item is S): S[];
    createList(predicate: (item: L, index: number, list: L[]) => unknown): L[];
    createList(values?: L['value'][]): L[];
    map: T;
    valueMap: V extends Record<string, any> ? V : FilterValueMap<T, V>;
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
declare function createFilter<T extends Record<string, any>, const V extends Record<string, any> | undefined | null = undefined, F extends FilterFunc<T, V> = FilterFunc<T, V>, E extends Record<string, any> = {}, W extends void | boolean | Record<string, any> = void, L extends Record<string, any> = WalkedItem<T, V, W>, A extends boolean = false>(map: T, valueMap: V | undefined, options: Omit<CreateFilterOptions<F, E, T, V, W, L, A>, 'external'> & {
    external: ExternalOptions<T, V, F, E, L, WalkedItem<T, V, W>> | ((filter: FilterThis<T, V, F, L, WalkedItem<T, V, W>>) => E & ThisType<FilterThis<T, V, F, L, WalkedItem<T, V, W>> & ResolvedExternal<E>> | null);
}): EnhancedResult<FilterThis<T, V, F, L, WalkedItem<T, V, W>> & ResolvedExternal<E>, L, A>;
declare function createFilter<T extends Record<string, any>, const V extends Record<string, any> | undefined | null = undefined, F extends FilterFunc<T, V> = FilterFunc<T, V>, E extends Record<string, any> = {}, W extends void | boolean | Record<string, any> = void, L extends Record<string, any> = WalkedItem<T, V, W>, A extends boolean = false>(map: T, valueMap?: V, options?: CreateFilterOptions<F, E, T, V, W, L, A>): EnhancedResult<FilterThis<T, V, F, L, WalkedItem<T, V, W>> & ResolvedExternal<E>, L, A>;
export { FilterKeyType, LabelsByValuesOptions, EnhancedMethods, CreateFilterOptions, ExternalFactoryBrand, ExternalFactoryFn, FilterListItem, FilterValueMap, FilterThis, ExternalOptions, FilterEx as Filter, isFilter, isDefaultFilter, createFilterMap, createExternalFactory, createFilter, };

# react-filter-utils

A powerful and flexible filter utility library for React applications. Create type-safe filters with custom mapping, external methods, and advanced configuration options.

[![NPM version](https://img.shields.io/npm/v/react-filter-utils.svg?style=flat)](https://npmjs.com/package/react-filter-utils)
[![NPM downloads](https://img.shields.io/npm/dm/react-filter-utils.svg?style=flat)](https://npmjs.com/package/react-filter-utils)

[English](https://github.com/gxlmyacc/react-filter-utils/blob/master/README.md) | [中文](https://github.com/gxlmyacc/react-filter-utils/blob/master/README_CN.md)

## Features

- 🎯 **Type-safe**: Full TypeScript support with comprehensive type definitions
- 🔧 **Flexible**: Support for custom filter functions, external methods, and advanced options
- 📋 **List Generation**: Automatic list generation for UI components
- 🎨 **Customizable**: Configurable ordering, filtering, and transformation
- ⚡ **Lightweight**: Small runtime footprint; `import` uses the modern ESM build without polyfills
- 📦 **Dual builds**: `require` → CJS (`cjs/`, Chrome 49 + optional `core-js` polyfills); `import` → ESM (`es/`, for modern bundlers)
- 🔄 **React-friendly**: Framework-agnostic core; pairs well with React UI components (e.g. Select options from `filter.list`)

## Peer & runtime dependencies

- **peer**: `react >= 16.8` (used in app code, not imported by this package at runtime)
- **dependency**: `core-js@3` (only referenced by the CJS `cjs/` build when polyfills are needed)

## Runtime environments

- **Node.js** (`engines >= 12`): required for developing and testing this package; not required in your app unless you `require()` the library on the server.
- **Browsers (CJS / `cjs/`)**: Babel target Chrome >= 49; may load `core-js@3` polyfills when you use `require('react-filter-utils')`.
- **Bundlers (ESM / `es/`)**: use `import`; no polyfills are injected — your app and bundler define browser/Node compatibility.

> **Breaking change in v0.2.0**: the CommonJS output directory was renamed from `esm/` to `cjs/`. Entry points in `package.json` `main` / `exports.require` point to `cjs/`; no code API changes.

## Installation

After cloning this repo, run `npm install` then `npm run build` to generate `cjs/`, `es/`, and `types/`.

```bash
npm install --save react-filter-utils
```

or

```bash
yarn add react-filter-utils
```

## Basic Usage

### 1. Create a Simple Filter

```typescript
// filter.ts
import { createFilter } from 'react-filter-utils';

const statusMap = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'Pending Review',
  DELETED: 'Deleted'
} as const;

const statusFilter = createFilter(statusMap);

export default statusFilter;
```

### 2. Use in React Component

```typescript
// StatusSelector.tsx
import React, { useState } from 'react';
import { Select } from 'antd';
import statusFilter from './filter';

function StatusSelector() {
  const [value, setValue] = useState('');

  return (
    <div>
      <Select
        value={value}
        onChange={setValue}
        placeholder="Select status"
      >
        {statusFilter.list.map((item) => (
          <Select.Option key={item.value} value={item.value}>
            {item.label}
          </Select.Option>
        ))}
      </Select>
      
      <div>Selected: {statusFilter(value)}</div>
    </div>
  );
}
```

## Advanced Usage

### 1. Custom Value Mapping

When your filter values are different from the mapping keys, or when the mapping table's keys are numbers, you can use the `valueMap` parameter to define the corresponding key's constant enumeration name:

```typescript
// filter.ts
import { createFilter } from 'react-filter-utils';

const statusMap = {
  1: 'Active',
  2: 'Inactive',
  3: 'Pending Review',
  4: 'Deleted'
} as const;

const valueMap = {
  ACTIVE: '1',
  INACTIVE: '2', 
  PENDING: '3',
  DELETED: '4'
} as const;

const statusFilter = createFilter(statusMap, valueMap);

export default statusFilter;
```

Use `as const` for enum maps and separately declared valueMap objects to preserve literal keys, values and extra fields for filtering and type guards. This only affects TypeScript types; it does not freeze objects at runtime.

#### Numeric Keys and Actual Value Types

`Object.keys()` always returns strings. For example, `{ 1: 'Active', 2: 'Inactive' }` produces list values `'1'` and `'2'`, typed as string literals `'1'` and `'2'`. To produce numeric list values, explicitly configure `value` on each object entry:

```typescript
import { createFilter } from 'react-filter-utils';

const filter = createFilter(
  {
    1: { label: 'Active', value: 1 },
    2: { label: 'Inactive', value: 2 },
  } as const,
  {
    ACTIVE: 1,
    DISABLED: 2,
  } as const,
);

filter.ACTIVE;        // 1, typed as the literal 1
filter.list[0].value; // A number, typed as 1 | 2
filter.createList([1]); // [{ label: 'Active', value: 1, order: 0 }]
filter(filter.ACTIVE); // 'Active'
```

An entry's `value` determines its actual list value and type. Primitive values such as `string`, `number`, `boolean`, `bigint`, `symbol`, `null`, and `undefined` are supported. Entries without `value` still use their string keys. Normal configurations follow TypeScript inference; use `as const` to preserve literal types such as `1` and `2`.

`valueMap` attaches readable constants such as `filter.ACTIVE`. Their names, values, and types come from `valueMap`, which does not change list values. To match constants to list values, use numbers in both places as shown above. Setting only `valueMap.ACTIVE` to `1` does not convert a list value from `'1'` to a number when the entry has no explicit `value`.

#### Literal Types in valueMap

Inline `valueMap` objects preserve literal types by default. Constants mounted on the filter are readonly properties:

```typescript
const filter = createFilter({ 1: 'Active' } as const, { ACTIVE: '1' } as const);
filter.ACTIVE; // Typed as '1', rather than string

// For separately declared variables, use as const to prevent early widening.
const valueMap = { ACTIVE: '1' } as const;
const anotherFilter = createFilter({ 1: 'Active' } as const, valueMap);
anotherFilter.ACTIVE; // Typed as '1'
```

With only `const valueMap = { ACTIVE: '1' }`, the field is still inferred as `string` and retains that type when passed to the function. `Readonly` prevents assignment but cannot recover an already widened type. These are TypeScript constraints; they do not freeze objects at runtime or change accessor behavior.

### 2. Complex Object Mapping

Support for objects with additional properties:

```typescript
// filter.ts
import { createFilter } from 'react-filter-utils';

const priorityMap = {
  HIGH: {
    label: 'High Priority',
    order: 1,
    color: '#ff4d4f',
    icon: '🔥'
  },
  MEDIUM: {
    label: 'Medium Priority', 
    order: 2,
    color: '#faad14',
    icon: '⚡'
  },
  LOW: {
    label: 'Low Priority',
    order: 3,
    color: '#52c41a',
    icon: '📌'
  }
} as const;

const priorityFilter = createFilter(priorityMap);

export default priorityFilter;
```

### 3. External Methods

Add custom methods to your filter:

```typescript
// filter.ts
import { createFilter } from 'react-filter-utils';

const statusMap = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'Pending Review',
  DELETED: 'Deleted'
} as const;

const externalMethods = {
  isActive(value: string) {
    return value === this.ACTIVE;
  },
  
  getActiveCount(items: any[]) {
    return items.filter(item => this.isActive(item.status)).length;
  },
  
  logStatus(value: string) {
    console.log(`Status changed to: ${this(value)}`);
  }
};

const statusFilter = createFilter(statusMap, null, {
  external: externalMethods
});

export default statusFilter;
```

### 4. Custom Filter Function

Override the default filter behavior:

```typescript
// filter.ts
import { createFilter } from 'react-filter-utils';

const statusMap = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'Pending Review',
  DELETED: 'Deleted'
} as const;

const customFilter = (value: string, defaultLabel: string = 'Unknown') => {
  if (!value) return 'No Status';
  return statusMap[value as keyof typeof statusMap] || defaultLabel;
};

const statusFilter = createFilter(statusMap, null, {
  filter: customFilter
});

export default statusFilter;
```

### 5. Advanced Configuration

```typescript
// filter.ts
import { createFilter } from 'react-filter-utils';

const statusMap = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'Pending Review',
  DELETED: 'Deleted'
} as const;

const statusFilter = createFilter(statusMap, null, {
  // Reverse the list order
  reverseList: true,
  
  // Custom list item processing
  onWalkListItem: (item, index) => {
    // Add custom properties
    return {
      ...item,
      disabled: item.value === 'DELETED',
      tooltip: `Status: ${item.label}`
    };
  },
  
  // Custom list filtering
  onGetList: (list) => {
    return list.filter(item => item.value !== 'DELETED');
  },
  
  // External methods
  external: {
    getActiveStatuses() {
      return this.list.filter(item => item.value === 'ACTIVE');
    }
  }
});

export default statusFilter;
```

## API Reference

### `createFilter(map, valueMap?, options?)`

Creates a filter function with additional properties and methods.

#### Parameters

- `map` (Required): Object mapping keys to labels or label objects
- `valueMap` (Optional): Object mapping keys to different values
- `options` (Optional): Configuration options


#### map
Object mapping keys to labels or label objects.
The `map` parameter defines the base data structure for filter options. It is an object where each key represents a unique identifier for a filter item, and the value can be either a string (used as the label) or an object (for customizing more properties).

**The value of `map` supports the following built-in properties:**

- `label` (`string`): The display name of the filter item. If the value is a string, it is used directly as the label; if it is an object, you should explicitly specify the `label` field.
- `order` (`number`, optional): Customizes the sort order of the filter item in the list. Lower numbers appear earlier; omitted orders use traversal indices starting at 0, with stable ordering for ties.
- Other custom fields: You can add any custom fields in the object. These fields will be preserved in the generated list items for further extension.

**Example:**

```js
// simple mapping，the oder of the filter item in the list is determined by the key
const statusMap = /** @type {const} */ ({
  1: 'Active',
  2: 'Inactive',
  3: 'Pending Review',
  4: 'Deleted'
});
```
or
```js
// custom the order of the filter item in the list by specifying the `order` field
const statusMap = /** @type {const} */ ({
  1: { label: 'Active', order: 2 },
  2: { label:  'Inactive', order: 1 },
  3: { label: 'Pending Review', order: 3 },
  4: { label: 'Deleted', order: 4 }
});
```

When valueMap is omitted or null, `filter.valueMap` exposes the generated mapping, such as `{ 1: '1', 2: '2' }`. Mounted constants use these string values independently of embedded list values. Explicit maps retain their reference and descriptors. Inline valueMap objects use const inference and mounted constants are readonly in TypeScript; previously declared variables retain their declared types, so use `as const` to preserve literals.

#### Options

| Option | Type | Description |
|--------|------|-------------|
| `enhance` | `boolean` | Default false; enable queries, grouping and label joining for unoccupied names |
| `reverseList` | `boolean` | Reverse the order of generated list |
| `filter` | `Function` | Custom filter function |
| `external` | `Object \| Function` | External methods to attach |
| `onWalkListItem` | `Function` | Callback for each list item |
| `onGetList` | `Function` | Customize the final list |
| `onSetList` | `Function` | Handle list updates |

### Filter Properties

| Property | Type | Description |
|----------|------|-------------|
| `list` | `FilterListItem[]` | Generated list for UI components |
| `map` | `Object` | Original mapping object |
| `valueMap` | `Object` | Effective mapping; omitted/null exposes generated string key values |
| `createList(valuesOrPredicate?)` | `Function` | Filter by actual values or a predicate; returns all items when omitted |

### `createList(valuesOrPredicate?)`

Pass actual values or a predicate receiving `(item, index, list)`. Predicate semantics match `Array.filter`:

```typescript
const filter = createFilter({
  ACTIVE: { label: 'Active', value: 1, disabled: false, color: 'green' },
  DISABLED: { label: 'Disabled', value: 2, disabled: true, color: 'gray' },
} as const);

filter.createList(); // All items
filter.createList([1]); // Select by actual value
filter.createList(item => !item.disabled); // Select by metadata
filter.createList((item, index, list) => index === 0 && list.length > 0);
```

Each call selects from the current `filter.list`, including transformations from `onGetList`. It returns a new array containing the original item references; the library's selection does not mutate the cached list. Predicate exceptions propagate to the caller. Explicit type guards narrow the returned item type:

```typescript
const mixedFilter = createFilter({
  ACTIVE: { label: 'Active', value: 1, color: 'green' },
  PENDING: 'Pending',
} as const);

type Item = typeof mixedFilter.list[number];
type ActiveItem = Extract<Item, { value: 1 }>;
const activeItems = mixedFilter.createList((item): item is ActiveItem => item.value === 1);
activeItems[0].color; // Typed as 'green'
```

An existing `createList` method supplied by `external` still overrides the built-in implementation.

### Optional enhancements (`enhance: true`)

These methods are disabled by default. When enabled, they are installed after constants and `external`, only for names that are unoccupied. Existing constants, custom filter function properties and external members take priority. Enhancements are not yet available while an external factory initializes.

Each method reads the current `filter.list` exactly once, including `onGetList` transformations. Queries use strict equality (`===`) and return the first match in list order. Results are not cached across calls, so list assignment and item mutations affect later queries. Internal helpers do not call other public methods that external may override.

```typescript
const filter = createFilter(
  {
    1: { label: 'Active', value: 1, category: 'available', color: 'green' },
    2: { label: 'Disabled', value: 2, category: 'unavailable', color: 'gray' },
    99: { label: 'Archived', value: 99, category: 'archived', color: 'black' },
  } as const,
  { ACTIVE: 1, DISABLED: 2 } as const,
  {
    enhance: true,
    onGetList: list => list.filter((item): boolean => item.value !== 99), // Exclude archived items from the final list
  },
);

filter.itemBy('category', 'available'); // First item, original reference
filter.itemByValue(1);                 // First item
filter.itemByLabel('Active');          // First item
filter.propBy(1, 'color');             // 'green'
filter.propBy('Active', 'color');      // 'green'
filter.propByValue(1, 'color');        // 'green'
filter.propByLabel('Disabled', 'color'); // 'gray'
filter.propByValue(99, 'color', 'black'); // 'black'
filter.groupBy('category').get('available'); // New array containing the first item
filter.labelsByValues([1, 99, 2]);     // 'Active,,Disabled'
filter.labelsByValues([1, 99, 2], {
  separator: ' / ', ignoreMissing: true,
}); // 'Active / Disabled'
```

`Item` below means the final list item type. Property names, matching values and returned fields are inferred from it. An inline `enhance: true` exposes the methods; a dynamic boolean flag makes them optional, requiring a check before calling.

#### `itemBy(prop, propValue)`, `itemByValue(value)`, `itemByLabel(label)`

```typescript
itemBy<P extends keyof Item>(prop: P, propValue: Item[P]): Item | undefined;
itemByValue(value: Item['value']): Item | undefined;
itemByLabel(label: Item['label']): Item | undefined;
```

`itemBy` matches a specified field; the other methods match `value` or `label`. Returns the first matching item's original reference, or `undefined`. Union item types also allow properties present on only some members; missing fields are treated as `undefined`.

#### `propBy(key, prop, defaultValue?)`, `propByValue(value, prop, defaultValue?)`, `propByLabel(label, prop, defaultValue?)`

```typescript
propBy<P extends keyof Item, D = undefined>(
  key: Item['value'] | Item['label'], prop: P, defaultValue?: D,
): Exclude<Item[P], undefined> | D;
propByValue<P extends keyof Item, D = undefined>(
  value: Item['value'], prop: P, defaultValue?: D,
): Exclude<Item[P], undefined> | D;
propByLabel<P extends keyof Item, D = undefined>(
  label: Item['label'], prop: P, defaultValue?: D,
): Exclude<Item[P], undefined> | D;
```

`propBy` matches either `value === key` or `label === key` in one traversal, returning the specified field of the first matching item. If one item's label equals another item's value, list order decides; use `propByValue` or `propByLabel` to restrict the match. Missing items or `undefined` fields return `defaultValue` (default `undefined`). Defined `null`, `false`, `0` and empty strings are preserved.

#### `groupBy(prop)`

```typescript
groupBy<P extends keyof Item>(prop: P): Map<Item[P], Item[]>;
```

Returns a new Map and new group arrays, preserving item references. Groups and their items follow current list insertion order. Numeric `1` and string `'1'` are distinct keys; objects group by reference, `NaN` shares a group, and missing fields group under `undefined`. Empty lists return an empty Map; use `.get(key)` to read a group. Uses basic Map APIs rather than `Map.groupBy`; Map is supported since Chrome 38, including Chrome 49 ([MDN compatibility data](https://github.com/mdn/browser-compat-data/blob/main/javascript/builtins/Map.json)).

#### `labelsByValues(values, options?)`

```typescript
labelsByValues(values: Item['value'][], options?: {
  separator?: string;       // Default ','
  ignoreMissing?: boolean;  // Default false
}): string;
```

Joins labels in input order, preserving duplicate values and using the first matching item for each value. Missing values occupy empty string slots by default: `[1, 99, 2]` yields `'Active,,Disabled'`. Set `ignoreMissing: true` to skip them. `separator` accepts a custom delimiter, including an empty string; empty input returns `''`.

### List transformations and ordering

Every generated item has `order`, defaulting to its traversal index starting at 0. `reverseList` runs before traversal; skipped items retain their original index positions. Numeric orders configured in map entries or returned walk objects take priority. Missing or nonnumeric orders fall back to the original traversal index. Lists always sort by final order ascending, retaining traversal order for ties.

Types follow three stages: `onWalkListItem` receives generated map entries; `false` skips, an object replaces the entry, and `true` or no return retains it. Replacement objects also receive a default order. `onGetList` receives walked cached entries; its return type determines public list reads, `createList`, enhancements and external list reads. Assignments to `filter.list` and `onSetList` use the cached item type.

```typescript
const converted = createFilter({ A: { label: 'A', value: 1 } } as const, null, {
  enhance: true,
  onWalkListItem: item => ({ ...item, disabled: false }),
  onGetList: list => list.map(item => ({ ...item, value: String(item.value) })),
});
converted.list[0].value; // string
converted.itemByValue('1')?.disabled; // boolean | undefined
converted.createList(item => !item.disabled); // Retains transformed fields
```

### FilterListItem Type

```typescript
import type { FilterListItem } from 'react-filter-utils';

type Map = {
  1: { label: string; value: number; color: string };
  2: { label: string };
};

type Item = FilterListItem<Map, undefined>;
// { value: number; label: string; order: number; color: string }
// | { value: '2'; label: string; order: number }
```

List types are inferred per map entry: an explicit `value` uses that field's type; otherwise the value uses the stringified key. Extra object fields are preserved. The second type parameter `V` remains for compatibility; `valueMap` does not participate in list value inference. This type describes generated entries; transformation callback return types determine the subsequent public list shape.

## Utility Functions

### `isFilter(value)`

Check if a value is a filter created by this library.

```typescript
import { isFilter } from 'react-filter-utils';

if (isFilter(myFilter)) {
  console.log('This is a valid filter');
}
```

### `isDefaultFilter(value)`

Check if a filter uses the default filter function.

```typescript
import { isDefaultFilter } from 'react-filter-utils';

if (isDefaultFilter(myFilter)) {
  console.log('This filter uses the default function');
}
```

## TypeScript Support

The library provides full TypeScript support with comprehensive type definitions:

```typescript
import { createFilter, Filter, FilterListItem } from 'react-filter-utils';

// Type-safe filter creation
const statusMap = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive'
} as const;

const statusFilter: Filter<typeof statusMap, undefined, any> = createFilter(statusMap);

// Type-safe usage
const label: string = statusFilter('ACTIVE'); // 'Active'
const list: FilterListItem<typeof statusMap, undefined>[] = statusFilter.list;
```

## Examples

### Form Validation Filter

```typescript
// validationFilter.ts
import { createFilter } from 'react-filter-utils';

const validationMap = {
  REQUIRED: 'This field is required',
  EMAIL: 'Please enter a valid email',
  MIN_LENGTH: 'Minimum length is 6 characters',
  MAX_LENGTH: 'Maximum length is 50 characters'
} as const;

const validationFilter = createFilter(validationMap, null, {
  external: {
    getMessage(type: string, field: string) {
      return this(type).replace('field', field);
    }
  }
});

export default validationFilter;
```

### Multi-language Filter

```typescript
// languageFilter.ts
import { createFilter } from 'react-filter-utils';

const languageMap = {
  EN: { label: 'English', code: 'en', flag: '🇺🇸' },
  ES: { label: 'Español', code: 'es', flag: '🇪🇸' },
  FR: { label: 'Français', code: 'fr', flag: '🇫🇷' },
  DE: { label: 'Deutsch', code: 'de', flag: '🇩🇪' }
} as const;

const languageFilter = createFilter(languageMap, null, {
  onWalkListItem: (item) => ({
    ...item,
    displayText: `${item.flag} ${item.label}`
  })
});

export default languageFilter;
```

## License

[MIT](./LICENSE)


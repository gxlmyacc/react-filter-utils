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
};

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
};

const valueMap = {
  ACTIVE: '1',
  INACTIVE: '2', 
  PENDING: '3',
  DELETED: '4'
};

const statusFilter = createFilter(statusMap, valueMap);

export default statusFilter;
```

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
};

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
};

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
};

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
};

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
- `order` (`number`, optional): Customizes the sort order of the filter item in the list. Lower numbers appear earlier.
- Other custom fields: You can add any custom fields in the object. These fields will be preserved in the generated list items for further extension.

**Example:**

```js
// simple mapping，the oder of the filter item in the list is determined by the key
const statusMap = {
  1: 'Active',
  2: 'Inactive',
  3: 'Pending Review',
  4: 'Deleted'
};
```
or
```js
// custom the order of the filter item in the list by specifying the `order` field
const statusMap = {
  1: { label: 'Active', order: 2 },
  2: { label:  'Inactive', order: 1 },
  3: { label: 'Pending Review', order: 3 },
  4: { label: 'Deleted', order: 4 }
};
```

#### Options

| Option | Type | Description |
|--------|------|-------------|
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
| `valueMap` | `Object` | Value mapping object |
| `createList(values?)` | `Function` | Create filtered list |

### FilterListItem Type

```typescript
type FilterListItem<T, V> = {
  value: V extends Record<string, infer U> ? U : keyof T;
  label: string;
  order?: number;
} & (T[keyof T] extends Record<string, any> ? T[keyof T] : {});
```

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
};

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
};

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


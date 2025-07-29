# react-filter-utils

一个功能强大且灵活的React应用程序过滤器工具库。创建类型安全的过滤器，支持自定义映射、外部方法和高级配置选项。

[![NPM version](https://img.shields.io/npm/v/react-filter-utils.svg?style=flat)](https://npmjs.com/package/react-filter-utils)
[![NPM downloads](https://img.shields.io/npm/dm/react-filter-utils.svg?style=flat)](https://npmjs.com/package/react-filter-utils)

[English](https://github.com/gxlmyacc/react-filter-utils/blob/master/README.md) | [中文](https://github.com/gxlmyacc/react-filter-utils/blob/master/README_CN.md)

## 特性

- 🎯 **类型安全**: 完整的TypeScript支持，提供全面的类型定义
- 🔧 **灵活性强**: 支持自定义过滤器函数、外部方法和高级选项
- 📋 **列表生成**: 为UI组件自动生成列表
- 🎨 **可定制**: 可配置的排序、过滤和转换
- ⚡ **轻量级**: 零依赖，针对性能优化
- 🔄 **响应式**: 与React状态管理无缝协作

## 安装

```bash
npm install --save react-filter-utils
```

或

```bash
yarn add react-filter-utils
```

## 基本用法

### 1. 创建简单过滤器

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

### 2. 在React组件中使用

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

## 高级用法

### 1. 自定义值映射

当您的过滤器值与映射键不同时，或者映射表的key是数字时，您可以使用 `valueMap` 参数来定义对应key的常量枚举名称：

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

### 2. 复杂对象映射

支持具有附加属性的对象：

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

### 3. 外部方法

为您的过滤器添加自定义方法：

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

### 4. 自定义过滤器函数

覆盖默认的过滤器行为：

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

### 5. 高级配置

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
  // 反转列表顺序
  reverseList: true,
  
  // 自定义列表项处理
  onWalkListItem: (item, index) => {
    // 添加自定义属性
    return {
      ...item,
      disabled: item.value === 'DELETED',
      tooltip: `Status: ${item.label}`
    };
  },
  
  // 自定义列表过滤
  onGetList: (list) => {
    return list.filter(item => item.value !== 'DELETED');
  },
  
  // 外部方法
  external: {
    getActiveStatuses() {
      return this.list.filter(item => item.value === 'ACTIVE');
    }
  }
});

export default statusFilter;
```

## API 参考

### `createFilter(map, valueMap?, options?)`

创建一个具有附加属性和方法的过滤器函数。

#### 参数

- `map` (必需): 将键映射到标签或标签对象的对象
- `valueMap` (可选): 将键映射到不同值的对象
- `options` (可选): 配置选项

##### map
将键映射到标签或标签对象的对象。
`map` 参数定义了过滤器选项的基础数据结构。它是一个对象，其中每个键代表过滤器项的唯一标识符，值可以是字符串（用作标签）或对象（用于自定义更多属性）。

**`map` 的值支持以下内置属性：**

- `label` (`string`): 过滤器项的显示名称。如果值是字符串，则直接用作标签；如果是对象，则应明确指定 `label` 字段。
- `order` (`number`, 可选): 自定义过滤器项在列表中的排序顺序。数字越小出现越早。
- 其他自定义字段: 您可以在对象中添加任何自定义字段。这些字段将保留在生成的列表项中以供进一步扩展。

**示例：**

```js
// 简单映射，过滤器项在列表中的顺序由键决定
const statusMap = {
  1: 'Active',
  2: 'Inactive',
  3: 'Pending Review',
  4: 'Deleted'
};
```
或
```js
// 通过指定 `order` 字段自定义过滤器项在列表中的顺序
const statusMap = {
  1: { label: 'Active', order: 2 },
  2: { label:  'Inactive', order: 1 },
  3: { label: 'Pending Review', order: 3 },
  4: { label: 'Deleted', order: 4 }
};
```

##### options

| 选项 | 类型 | 描述 |
|------|------|------|
| `reverseList` | `boolean` | 反转生成列表的顺序 |
| `filter` | `Function` | 自定义过滤器函数 |
| `external` | `Object \| Function` | 要附加的外部方法 |
| `onWalkListItem` | `Function` | 每个列表项的回调 |
| `onGetList` | `Function` | 自定义最终列表 |
| `onSetList` | `Function` | 处理列表更新 |

### 过滤器属性

| 属性 | 类型 | 描述 |
|------|------|------|
| `list` | `FilterListItem[]` | 为UI组件生成的列表 |
| `map` | `Object` | 原始映射对象 |
| `valueMap` | `Object` | 值映射对象 |
| `createList(values?)` | `Function` | 创建过滤列表 |

### FilterListItem 类型

```typescript
type FilterListItem<T, V> = {
  value: V extends Record<string, infer U> ? U : keyof T;
  label: string;
  order?: number;
} & (T[keyof T] extends Record<string, any> ? T[keyof T] : {});
```

## 工具函数

### `isFilter(value)`

检查值是否是由此库创建的过滤器。

```typescript
import { isFilter } from 'react-filter-utils';

if (isFilter(myFilter)) {
  console.log('这是一个有效的过滤器');
}
```

### `isDefaultFilter(value)`

检查过滤器是否使用默认过滤器函数。

```typescript
import { isDefaultFilter } from 'react-filter-utils';

if (isDefaultFilter(myFilter)) {
  console.log('此过滤器使用默认函数');
}
```

## TypeScript 支持

该库提供完整的TypeScript支持，具有全面的类型定义：

```typescript
import { createFilter, Filter, FilterListItem } from 'react-filter-utils';

// 类型安全的过滤器创建
const statusMap = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive'
} as const;

const statusFilter: Filter<typeof statusMap, undefined, any> = createFilter(statusMap);

// 类型安全的使用
const label: string = statusFilter('ACTIVE'); // 'Active'
const list: FilterListItem<typeof statusMap, undefined>[] = statusFilter.list;
```

## 示例

### 表单验证过滤器

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

### 多语言过滤器

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

## 许可证

[MIT](./LICENSE) 

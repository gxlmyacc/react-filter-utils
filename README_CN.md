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
- ⚡ **轻量级**: 运行时体积小；`import` 使用现代 ESM 构建，不注入 polyfill
- 📦 **双构建**: `require` → CJS（`cjs/`，Chrome 49 + 按需 `core-js`）；`import` → ESM（`es/`，面向现代打包器）
- 🔄 **适配 React**: 核心与框架无关，便于在 React 组件中使用（如用 `filter.list` 渲染 Select 选项）

## 对等依赖与运行时依赖

- **peer**：`react >= 16.8`（在业务代码中使用，本包运行时不会 import React）
- **dependency**：`core-js@3`（仅 CJS 的 `cjs/` 产物在需要时引用 polyfill）

## 运行时环境

- **Node.js**（`engines >= 12`）：用于本仓库的开发与测试；业务应用仅在服务端 `require()` 本库时才需要 Node。
- **浏览器（CJS / `cjs/`）**：构建目标 Chrome >= 49；使用 `require('react-filter-utils')` 时可能加载 `core-js@3` polyfill。
- **打包器（ESM / `es/`）**：使用 `import`；不注入 polyfill，兼容性由应用与打包器决定。

> **v0.2.0 破坏性变更**：CommonJS 输出目录由 `esm/` 重命名为 `cjs/`。`package.json` 的 `main` / `exports.require` 已指向 `cjs/`，对外 API 无变化。

## 安装

克隆本仓库后请执行 `npm install`，再运行 `npm run build` 生成 `cjs/`、`es/` 与 `types/`。

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
} as const;

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

建议为枚举 `map` 和单独定义的 `valueMap` 添加 `as const`，保留 key、value 和额外字段的字面量类型，便于筛选和类型守卫。它仅影响 TypeScript 类型，不会在运行时冻结对象。

#### 数字 key 与实际值类型

对象的 key 经 `Object.keys()` 读取后都是字符串。例如 `{ 1: '启用', 2: '禁用' }` 生成的列表值为 `'1'`、`'2'`，类型也分别为字符串字面量 `'1'`、`'2'`。需要数字列表值时，在对象项中显式配置 `value`：

```typescript
import { createFilter } from 'react-filter-utils';

const filter = createFilter(
  {
    1: { label: '启用', value: 1 },
    2: { label: '禁用', value: 2 },
  } as const,
  {
    ACTIVE: 1,
    DISABLED: 2,
  } as const,
);

filter.ACTIVE;        // 1，类型为字面量 1
filter.list[0].value; // 数字，类型为 1 | 2
filter.createList([1]); // [{ label: '启用', value: 1, order: 0 }]
filter(filter.ACTIVE); // '启用'
```

对象内的 `value` 决定列表的实际值和类型，支持 `string`、`number`、`boolean`、`bigint`、`symbol`、`null`、`undefined` 等原始值；未配置的项仍使用字符串 key。普通配置沿用 TypeScript 的类型推导，使用 `as const` 可保留 `1`、`2` 等字面量类型。

`valueMap` 用于挂载 `filter.ACTIVE` 等易读常量，其名称、值和类型由 `valueMap` 决定，不改变列表值。因此要让常量与列表值对应，应像上例一样在两个位置都使用数字。仅把 `valueMap.ACTIVE` 配置为 `1`，不会把未配置 `value` 的列表项从 `'1'` 转成数字。

#### valueMap 的字面量类型

直接传入 `valueMap` 对象时，默认保留字面量类型，挂载到 filter 的常量为只读属性：

```typescript
const filter = createFilter({ 1: '启用' } as const, { ACTIVE: '1' } as const);
filter.ACTIVE; // 类型为 '1'，而非 string

// 分开定义变量时，用 as const 避免字段类型提前拓宽为 string。
const valueMap = { ACTIVE: '1' } as const;
const anotherFilter = createFilter({ 1: '启用' } as const, valueMap);
anotherFilter.ACTIVE; // 类型为 '1'
```

仅用 `const valueMap = { ACTIVE: '1' }`，字段仍会被推导为 `string`，传入函数后也会保持 `string`。`Readonly` 只限制赋值，不会还原已经拓宽的类型；这些约束属于 TypeScript 类型层面，不会在运行时冻结对象或改变访问器行为。

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
} as const;

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

### 5. 高级配置

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
- `order` (`number`, 可选): 自定义过滤器项在列表中的排序顺序。数字越小出现越早；未配置时使用从 0 开始的遍历下标，相同值保留遍历顺序。
- 其他自定义字段: 您可以在对象中添加任何自定义字段。这些字段将保留在生成的列表项中以供进一步扩展。

**示例：**

JavaScript 示例使用 JSDoc const 断言 `/** @type {const} */ ({ ... })`，在开启 `checkJs` 或编辑器类型检查时同样保留字面量类型。

```js
// 简单映射，过滤器项在列表中的顺序由键决定
const statusMap = /** @type {const} */ ({
  1: 'Active',
  2: 'Inactive',
  3: 'Pending Review',
  4: 'Deleted'
});
```
或
```js
// 通过指定 `order` 字段自定义过滤器项在列表中的顺序
const statusMap = /** @type {const} */ ({
  1: { label: 'Active', order: 2 },
  2: { label:  'Inactive', order: 1 },
  3: { label: 'Pending Review', order: 3 },
  4: { label: 'Deleted', order: 4 }
});
```

未传入 `valueMap` 或传入 `null` 时，`filter.valueMap` 暴露自动生成的映射，例如 `{ 1: '1', 2: '2' }`，挂载常量也使用这些字符串值，与对象内的实际列表 `value` 无关。显式传入时保留原对象引用和属性描述符。内联 valueMap 默认按 const 推导，挂载常量在类型上只读；提前定义的变量仍沿用其已有类型，要保留字面量可使用 `as const`。

##### options

| 选项 | 类型 | 描述 |
|------|------|------|
| `enhance` | `boolean` | 默认 false；开启未被现有属性占用的查询、分组和标签拼接方法 |
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
| `valueMap` | `Object` | 实际使用的映射；省略或传 null 时暴露自动生成的字符串 key 映射 |
| `createList(valuesOrPredicate?)` | `Function` | 按实际列表值数组或过滤函数筛选；省略时返回全部项 |

### `createList(valuesOrPredicate?)`

支持指定实际值或传入过滤函数，函数接收 `(item, index, list)`，筛选语义与 `Array.filter` 相同：

```typescript
const filter = createFilter({
  ACTIVE: { label: '启用', value: 1, disabled: false, color: 'green' },
  DISABLED: { label: '禁用', value: 2, disabled: true, color: 'gray' },
} as const);

filter.createList(); // 全部列表项
filter.createList([1]); // 按实际 value 筛选
filter.createList(item => !item.disabled); // 按额外字段筛选
filter.createList((item, index, list) => index === 0 && list.length > 0);
```

每次调用都从当前 `filter.list` 筛选，因此包含 `onGetList` 的处理结果。返回新数组，列表项保留原引用；库的筛选过程不会修改缓存列表。过滤函数抛出的异常会向调用方传播。显式类型守卫可收窄返回项类型：

```typescript
const mixedFilter = createFilter({
  ACTIVE: { label: '启用', value: 1, color: 'green' },
  PENDING: '待处理',
} as const);

type Item = typeof mixedFilter.list[number];
type ActiveItem = Extract<Item, { value: 1 }>;
const activeItems = mixedFilter.createList((item): item is ActiveItem => item.value === 1);
activeItems[0].color; // 类型为 'green'
```

现有 external 中的同名 `createList` 方法仍会覆盖内置实现。

### 可选增强方法（`enhance: true`）

默认不挂载这些方法。开启后，在常量和 `external` 挂载完成之后，仅补充未被占用的方法名；已有常量、自定义 filter 函数上的属性和 external 优先。external 工厂初始化时尚未挂载增强方法。

每个增强方法仅读取一次当前 `filter.list`，包含 `onGetList` 的转换结果。查询使用严格相等（`===`），重复值返回列表中的第一个匹配项；不跨调用缓存查询结果，列表赋值和字段修改会影响后续查询。方法内部不会调用可被 external 覆盖的其他公开方法。

```typescript
const filter = createFilter(
  {
    1: { label: '启用', value: 1, category: 'available', color: 'green' },
    2: { label: '禁用', value: 2, category: 'unavailable', color: 'gray' },
    99: { label: '已归档', value: 99, category: 'archived', color: 'black' },
  } as const,
  { ACTIVE: 1, DISABLED: 2 } as const,
  {
    enhance: true,
    onGetList: list => list.filter((item): boolean => item.value !== 99), // 最终列表不含已归档项
  },
);

filter.itemBy('category', 'available'); // 第一项，保留原引用
filter.itemByValue(1);                 // 第一项
filter.itemByLabel('启用');            // 第一项
filter.propBy(1, 'color');             // 'green'
filter.propBy('启用', 'color');        // 'green'
filter.propByValue(1, 'color');        // 'green'
filter.propByLabel('禁用', 'color');   // 'gray'
filter.propByValue(99, 'color', 'black'); // 'black'
filter.groupBy('category').get('available'); // 第一项组成的新数组
filter.labelsByValues([1, 99, 2]);     // '启用,,禁用'
filter.labelsByValues([1, 99, 2], {
  separator: '、', ignoreMissing: true,
}); // '启用、禁用'
```

以下签名中的 `Item` 指最终列表项类型；属性名、匹配值和返回字段类型均来自该类型。内联 `enhance: true` 会推导出增强方法，动态 boolean 开关下方法可能不存在，调用前需检查。

#### `itemBy(prop, propValue)`、`itemByValue(value)`、`itemByLabel(label)`

```typescript
itemBy<P extends keyof Item>(prop: P, propValue: Item[P]): Item | undefined;
itemByValue(value: Item['value']): Item | undefined;
itemByLabel(label: Item['label']): Item | undefined;
```

`itemBy` 根据指定字段匹配；另外两个方法分别根据 `value`、`label` 匹配。返回第一个匹配项的原引用；未找到返回 `undefined`。对于联合项类型，也支持仅部分项具有的字段，缺少该字段时视为 `undefined`。

#### `propBy(key, prop, defaultValue?)`、`propByValue(value, prop, defaultValue?)`、`propByLabel(label, prop, defaultValue?)`

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

`propBy` 在同一次遍历中匹配 `value === key` 或 `label === key`，返回第一个匹配项的指定字段。若某项的 label 与另一项的 value 相同，以列表中先出现的项为准；需限定匹配位置时使用 `propByValue` 或 `propByLabel`。未找到项或字段值为 `undefined` 时返回 `defaultValue`（默认 `undefined`）；字段本身的 `null`、`false`、`0`、空字符串保持原值。

#### `groupBy(prop)`

```typescript
groupBy<P extends keyof Item>(prop: P): Map<Item[P], Item[]>;
```

按字段值分组，每次返回新的 `Map` 和分组数组，项保留原引用。分组和组内项按当前列表顺序插入。数字 `1` 与字符串 `'1'` 是不同分组，对象按引用分组，`NaN` 归为同一组，缺少字段的项归到 `undefined`。空列表返回空 Map，使用 `.get(key)` 读取分组。使用基本 Map API，不依赖 `Map.groupBy`；Map 自 Chrome 38 起支持，可用于 Chrome 49（[MDN 兼容性数据](https://github.com/mdn/browser-compat-data/blob/main/javascript/builtins/Map.json)）。

#### `labelsByValues(values, options?)`

```typescript
labelsByValues(values: Item['value'][], options?: {
  separator?: string;     // 默认 ','
  ignoreMissing?: boolean; // 默认 false
}): string;
```

按输入值的顺序拼接标签，保留重复值，每个值使用第一个匹配项的标签。默认将未匹配的值保留为空字符串占位，例如 `[1, 99, 2]` 得到 `'启用,,禁用'`；`ignoreMissing: true` 时忽略未匹配的值。`separator` 可自定义，支持空字符串；空输入返回 `''`。

### 列表转换与排序

生成项均有 `order`：默认采用遍历下标，从 0 开始；`reverseList` 在遍历之前执行，跳过项仍占用原下标。map 中的数字 `order`、遍历回调返回对象中的数字 `order` 优先使用其配置值；缺失或非数字时使用原遍历下标。列表总是按最终 `order` 升序排序，相同 order 保持遍历顺序。

类型按三个阶段推导：`onWalkListItem` 接收 map 生成项；返回 `false` 跳过，返回对象替换该项，返回 `true` 或无返回值则保留该项。替换对象也会补齐默认 `order`。`onGetList` 接收遍历后的缓存项，返回类型决定 `filter.list` 的读取类型、`createList`、增强方法和 external 的列表读取类型。给 `filter.list` 赋值和 `onSetList` 则使用缓存项类型。

```typescript
const converted = createFilter({ A: { label: 'A', value: 1 } } as const, null, {
  enhance: true,
  onWalkListItem: item => ({ ...item, disabled: false }),
  onGetList: list => list.map(item => ({ ...item, value: String(item.value) })),
});
converted.list[0].value; // string
converted.itemByValue('1')?.disabled; // boolean | undefined
converted.createList(item => !item.disabled); // 保留转换后的字段
```

### FilterListItem 类型

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

列表类型按 map 每项分别推导：显式 `value` 使用该字段的类型，否则使用字符串化 key；对象的额外字段也会保留。第二个类型参数 `V` 保留用于兼容现有代码，`valueMap` 不参与列表值的推导。此类型表达原始生成项；配置转换回调后，最终列表类型继续按回调返回值推导。

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

### 多语言过滤器

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

## 许可证

[MIT](./LICENSE) 

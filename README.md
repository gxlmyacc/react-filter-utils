# react-filter-utils

filter utils for react


[![NPM version](https://img.shields.io/npm/v/react-filter-utils.svg?style=flat)](https://npmjs.com/package/react-filter-utils)
[![NPM downloads](https://img.shields.io/npm/dm/react-filter-utils.svg?style=flat)](https://npmjs.com/package/react-filter-utils)

## install

```bash
npm install --save react-filter-utils
```
or
```bash
yarn add react-filter-utils
```

## usage

### 1. define a filter:
```js
// filter.js
import { createFilter } from 'react-filter-utils';

const map = {
  YES: 'yes',
  NO: 'no',
  OTHER: 'other options',
};

const _external = {
  something(v) {
    console.log(v)
  }
};

const filter = createFilter(map, null {
  external: _external,
  // or
  external(filter) {
    return _external
  }
});

export default filter;

```
or

```js
// filter.js
import { createFilter } from 'react-filter-utils';

const map = {
  1: 'yes',
  2: 'no',
  3: 'other options',
};

const _external = {
  something(v) {
    console.log(v)
  }
};

const filter = createFilter(map, {
  YES: '1',
  NO: '2',
  OTHER: '3',
} {
  external: _external,
  // or
  external(filter) {
    return _external
  }
});

export default filter;

```

### 2. use the filter:
```js
// test.js

import React, { useState } from 'react';
import filter from './filter.js';
import { Select } from 'antd';

function Test() {
  const [value, setValue] = useState('');

  useEffact(()=> {
    console.log(/* value*/ filter.YES, /* label */ filter(filter.YES));
    
    // call external method of the filter
    filter.something();
  }, []);

  return (
    <>
      <Select
        value={value}
        onChange={value => setValue(value)}
      >
        {
          // render list using filter
          filter.list.map(
            (item) => (<Select.Option key={item.value} value={item.value}>{item.label}</Select.Option>)
          )
        }
      </Select>
    <hr />
    result: you selected {filter(value)}
  </>
  );
}
```

## License

[MIT](./LICENSE)


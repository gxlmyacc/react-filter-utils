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

```js
// a filter.js
import { createFilter } from 'react-filter-utils';

const map = {
  KEY1: 'key1 label',
  KEY2: 'key2 label',
  KEY3: 'key3label',
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

```js
// test.js

import React, { useState } from 'react';
import filter from './filter.js';
import { Select } from 'antd';

function Test() {
  const [value, setValue] = useState('');

  useEffact(()=> {
    console.log(filter.KEY1, filter(filter.KEY1));
    
    filter.something();
  }, []);

  return (
    <>
      <Select
        value={value}
        onChange={value => setValue(value)}
      >
        {
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


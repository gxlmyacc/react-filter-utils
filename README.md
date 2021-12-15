# react-filter-utils

filter utils for react"

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

const extends = {
  something(v) {
    console.log(v)
  }
};

const filter = createFilter<['KEY1', 'KEY2', 'KEY3'], extends>(map);

Object.assign(filter, extends);

export default filter;

```

```js
// test.js

import React, { useState } from 'react';
import filter from './filter.js';
import { Select } from 'antd';

function Test() {
  const [value, setValue] = useState(null);

  useEffact(()=> {
    console.log(filter.KEY1, filter(filter.KEY1));
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


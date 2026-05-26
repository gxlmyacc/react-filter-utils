import {
  createExternalFactory,
  createFilter,
  createFilterMap,
  isFilter,
  isDefaultFilter,
} from '../src/index';

describe('createFilter', () => {
  const statusMap = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    PENDING: 'Pending Review',
    DELETED: 'Deleted',
  };

  describe('基础过滤', () => {
    it('应根据 map 返回对应标签', () => {
      const filter = createFilter(statusMap);
      expect(filter('ACTIVE')).toBe('Active');
      expect(filter('INACTIVE')).toBe('Inactive');
    });

    it('未知 key 应返回 defaultLabel', () => {
      const filter = createFilter(statusMap);
      expect(filter('UNKNOWN' as any)).toBe('');
      expect(filter('UNKNOWN' as any, 'N/A')).toBe('N/A');
    });

    it('对象映射缺少 label 时应回退到 defaultLabel', () => {
      const map = { A: { order: 1 } };
      const filter = createFilter(map);
      expect(filter('A', 'fallback')).toBe('fallback');
    });

    it('对象映射 label 为空字符串时应回退到 defaultLabel', () => {
      const map = { A: { label: '' } };
      const filter = createFilter(map);
      expect(filter('A', 'fallback')).toBe('fallback');
    });

    it('应暴露 map，并将 valueMap 键挂载到 filter 上', () => {
      const filter = createFilter(statusMap);
      expect(filter.map).toBe(statusMap);
      expect(filter.ACTIVE).toBe('ACTIVE');
      expect(filter.INACTIVE).toBe('INACTIVE');
      expect(filter.PENDING).toBe('PENDING');
      expect(filter.DELETED).toBe('DELETED');
    });

    it('自动生成 valueMap 时应跳过空键', () => {
      const map = { '': 'empty', A: 'a' };
      const filter = createFilter(map);
      expect(filter.A).toBe('A');
      expect(Object.prototype.hasOwnProperty.call(filter, '')).toBe(false);
    });
  });

  describe('list', () => {
    it('应生成与 map 键顺序一致的列表', () => {
      const filter = createFilter(statusMap);
      expect(filter.list).toEqual([
        { value: 'ACTIVE', label: 'Active' },
        { value: 'INACTIVE', label: 'Inactive' },
        { value: 'PENDING', label: 'Pending Review' },
        { value: 'DELETED', label: 'Deleted' },
      ]);
    });

    it('reverseList 应反转列表顺序', () => {
      const filter = createFilter(statusMap, null, { reverseList: true });
      expect(filter.list.map(item => item.value)).toEqual([
        'DELETED',
        'PENDING',
        'INACTIVE',
        'ACTIVE',
      ]);
    });

    it('含 order 的对象应按 order 排序', () => {
      const priorityMap = {
        HIGH: { label: 'High', order: 3 },
        MEDIUM: { label: 'Medium', order: 1 },
        LOW: { label: 'Low', order: 2 },
      };
      const filter = createFilter(priorityMap);
      expect(filter.list.map(item => item.value)).toEqual(['MEDIUM', 'LOW', 'HIGH']);
      expect(filter('HIGH')).toBe('High');
    });

    it('部分项无 order 时排序应视为 0', () => {
      const map = {
        A: { label: 'A', order: 2 },
        B: { label: 'B' },
        C: { label: 'C', order: 1 },
      };
      const filter = createFilter(map);
      expect(filter.list.map(item => item.value)).toEqual(['B', 'C', 'A']);
    });

    it('map 值为空字符串时不应展开对象字段', () => {
      const map = { EMPTY: '' };
      const filter = createFilter(map);
      expect(filter.list).toEqual([{ value: 'EMPTY', label: '' }]);
    });

    it('list 应惰性初始化并缓存', () => {
      const filter = createFilter(statusMap);
      const first = filter.list;
      const second = filter.list;
      expect(first).toBe(second);
    });

    it('复杂对象应保留额外字段', () => {
      const categoryMap = {
        TECH: { label: 'Technology', order: 1, color: '#1890ff' },
        DESIGN: { label: 'Design', order: 2, color: '#52c41a' },
      };
      const filter = createFilter(categoryMap);
      expect(filter.list[0]).toMatchObject({
        value: 'TECH',
        label: 'Technology',
        order: 1,
        color: '#1890ff',
      });
    });
  });

  describe('valueMap', () => {
    it('应使用自定义 valueMap 并挂载到 filter 上', () => {
      const numericMap = {
        1: 'Active',
        2: 'Inactive',
      };
      const valueMap = {
        ACTIVE: '1',
        INACTIVE: '2',
      };
      const filter = createFilter(numericMap, valueMap);
      expect(filter.ACTIVE).toBe('1');
      expect(filter.INACTIVE).toBe('2');
      expect(filter.valueMap).toBe(valueMap);
    });

    it('valueMap 含空键时应跳过挂载', () => {
      const map = { A: 'a' };
      const valueMap = { '': 'skip', A: 'A' };
      const filter = createFilter(map, valueMap);
      expect(filter.A).toBe('A');
      expect(Object.prototype.hasOwnProperty.call(filter, '')).toBe(false);
    });

    it('valueMap 键无属性描述符时不应挂载', () => {
      const map = { A: 'a' };
      const valueMap = { A: 'A', GHOST: 'g' };
      const getDescriptor = Object.getOwnPropertyDescriptor;
      const descriptorSpy = jest
        .spyOn(Object, 'getOwnPropertyDescriptor')
        .mockImplementation((target, key) => {
          if (key === 'GHOST') return undefined;
          return getDescriptor(target, key);
        });
      try {
        const filter = createFilter(map, valueMap);
        expect(filter.A).toBe('A');
        expect(Object.prototype.hasOwnProperty.call(filter, 'GHOST')).toBe(false);
      } finally {
        descriptorSpy.mockRestore();
      }
    });

    it('valueMap 键为 get/set 时应拷贝描述符到 filter 并与源共享状态', () => {
      const store = { activeCode: '1' };
      const numericMap = {
        1: 'Active',
        2: 'Inactive',
      };
      const valueMap: Record<string, string> = {};
      Object.defineProperty(valueMap, 'ACTIVE', {
        enumerable: true,
        configurable: true,
        get() {
          return store.activeCode;
        },
        set(v: string) {
          store.activeCode = v;
        },
      });
      Object.defineProperty(valueMap, 'INACTIVE', {
        enumerable: true,
        configurable: true,
        get: () => '2',
      });

      const filter = createFilter(numericMap, valueMap);

      const onFilter = Object.getOwnPropertyDescriptor(filter, 'ACTIVE');
      const onValueMap = Object.getOwnPropertyDescriptor(valueMap, 'ACTIVE');
      expect(onFilter?.get).toBe(onValueMap?.get);
      expect(onFilter?.set).toBe(onValueMap?.set);

      expect(filter.ACTIVE).toBe('1');
      store.activeCode = '99';
      expect(filter.ACTIVE).toBe('99');

      // @ts-expect-error ACTIVE 由 valueMap 访问器挂载，对 filter 赋值走自定义 setter
      filter.ACTIVE = '2';
      expect(store.activeCode).toBe('2');
      expect(filter.ACTIVE).toBe('2');
      expect(filter.INACTIVE).toBe('2');
    });

    it('map 中某 key 的标签为 get/set 时，修改后 filter 调用与 list 应读到新标签', () => {
      const store = { label: 'Active' };
      const numericMap: Record<string, string> = { 2: 'Inactive' };
      Object.defineProperty(numericMap, '1', {
        enumerable: true,
        configurable: true,
        get() {
          return store.label;
        },
        set(v: string) {
          store.label = v;
        },
      });

      const filter = createFilter(numericMap);

      expect(filter('1')).toBe('Active');

      store.label = 'Active1';

      expect(filter('1')).toBe('Active1');
      expect(filter.list[0]).toMatchObject({ value: '1', label: 'Active1' });
    });
  });

  describe('map 访问器属性', () => {
    it('map 上的 get/set 通过 filter.map 访问并与源对象共享状态', () => {
      const store = { meta: 'v1' };
      const map: Record<string, string> = { A: 'a' };
      Object.defineProperty(map, 'META', {
        enumerable: true,
        configurable: true,
        get() {
          return store.meta;
        },
        set(v: string) {
          store.meta = v;
        },
      });

      const filter = createFilter(map);

      expect(filter.map).toBe(map);
      expect(filter.map.META).toBe('v1');
      store.meta = 'v2';
      expect(filter.map.META).toBe('v2');

      filter.map.META = 'v3';
      expect(store.meta).toBe('v3');
      expect(map.META).toBe('v3');
    });
  });

  describe('createList', () => {
    it('无参数时应返回完整 list', () => {
      const filter = createFilter(statusMap);
      expect(filter.createList()).toHaveLength(4);
    });

    it('应仅返回指定 value 的项', () => {
      const filter = createFilter(statusMap);
      const list = filter.createList(['ACTIVE', 'DELETED']);
      expect(list).toHaveLength(2);
      expect(list.map(item => item.value)).toEqual(['ACTIVE', 'DELETED']);
    });
  });

  describe('options', () => {
    it('自定义 filter 函数应覆盖默认行为', () => {
      const customFilter = (value: string, defaultLabel = 'Unknown') => {
        if (!value) return 'No Status';
        return statusMap[value as keyof typeof statusMap] || defaultLabel;
      };
      const filter = createFilter(statusMap, null, { filter: customFilter });
      expect(filter('' as keyof typeof statusMap)).toBe('No Status');
      expect(filter('ACTIVE')).toBe('Active');
      expect(isDefaultFilter(filter)).toBe(false);
    });

    it('onWalkListItem 返回 false 应跳过该项', () => {
      const filter = createFilter(statusMap, null, {
        onWalkListItem: item => item.value !== 'DELETED',
      });
      expect(filter.list.find(item => item.value === 'DELETED')).toBeUndefined();
    });

    it('onWalkListItem 返回对象应替换列表项', () => {
      const filter = createFilter(statusMap, null, {
        onWalkListItem: item => ({
          ...item,
          disabled: item.value === 'DELETED',
        }),
      });
      const deleted = filter.list.find(item => item.value === 'DELETED');
      expect(deleted).toMatchObject({ disabled: true });
    });

    it('onGetList 应转换最终列表', () => {
      const filter = createFilter(statusMap, null, {
        onGetList: list => list.filter(item => item.value !== 'DELETED'),
      });
      expect(filter.list).toHaveLength(3);
    });

    it('onSetList 应在设置 list 时被调用', () => {
      const onSetList = jest.fn();
      const filter = createFilter(statusMap, null, { onSetList });
      const customList = [{ value: 'ACTIVE', label: 'Active' }];
      filter.list = customList as any;
      expect(onSetList).toHaveBeenCalledWith(customList);
      expect(filter.list).toBe(customList);
    });

    it('未配置 onSetList 时仍可直接设置 list', () => {
      const filter = createFilter(statusMap);
      const customList = [{ value: 'ACTIVE', label: 'Active' }];
      filter.list = customList as any;
      expect(filter.list).toBe(customList);
    });

    it('onWalkListItem 无返回值时应保留原列表项', () => {
      const filter = createFilter(statusMap, null, {
        onWalkListItem: () => undefined,
      });
      expect(filter.list).toHaveLength(4);
      expect(filter.list[0]).toMatchObject({ value: 'ACTIVE', label: 'Active' });
    });

    it('external 对象方法应挂载并可访问 this', () => {
      const filter = createFilter(statusMap, null, {
        external: {
          isActive(value: string) {
            return value === this.ACTIVE;
          },
        },
      });
      expect(filter.isActive('ACTIVE')).toBe(true);
      expect(filter.isActive('INACTIVE')).toBe(false);
    });

    it('external 函数形式应接收 filter 作为 this', () => {
      const filter = createFilter(statusMap, null, {
        external: createExternalFactory(filter => ({
          getLabelCount() {
            return filter.list.length;
          },
        })),
      });
      expect(filter.getLabelCount()).toBe(4);
    });

    it('external 函数返回空值时不应挂载方法', () => {
      const filter = createFilter(statusMap, null, {
        external: () => null,
      });
      expect(filter.list).toHaveLength(4);
      expect((filter as any).extraMethod).toBeUndefined();
    });

    it('external 返回对象中无 property descriptor 的键应被跳过', () => {
      const external = new Proxy(
        {},
        {
          ownKeys: () => ['ghost'],
          getOwnPropertyDescriptor: () => undefined,
        },
      );
      const filter = createFilter(statusMap, null, {
        external: () => external,
      });
      expect((filter as any).ghost).toBeUndefined();
      expect(filter.list).toHaveLength(4);
    });

    it('external 键为 get/set 时应拷贝描述符到 filter 并与源共享状态', () => {
      const store = { counter: 0 };
      const external: Record<string, number> = {};
      Object.defineProperty(external, 'counter', {
        enumerable: true,
        configurable: true,
        get() {
          return store.counter;
        },
        set(v: number) {
          store.counter = v;
        },
      });

      const filter = createFilter(statusMap, null, { external });

      const onFilter = Object.getOwnPropertyDescriptor(filter, 'counter');
      const onExternal = Object.getOwnPropertyDescriptor(external, 'counter');
      expect(onFilter?.get).toBe(onExternal?.get);
      expect(onFilter?.set).toBe(onExternal?.set);

      expect(filter.counter).toBe(0);
      store.counter = 7;
      expect(filter.counter).toBe(7);

      filter.counter = 12;
      expect(store.counter).toBe(12);
    });

    it('external 工厂返回的对象上 get/set 应与 filter 共享状态', () => {
      const store = { flag: false };
      const filter = createFilter(statusMap, null, {
        external: () => {
          const ext: Record<string, boolean> = {};
          Object.defineProperty(ext, 'flag', {
            enumerable: true,
            configurable: true,
            get() {
              return store.flag;
            },
            set(v: boolean) {
              store.flag = v;
            },
          });
          return ext;
        },
      });

      expect(filter.flag).toBe(false);
      store.flag = true;
      expect(filter.flag).toBe(true);

      filter.flag = false;
      expect(store.flag).toBe(false);
    });
  });
});

describe('createFilterMap', () => {
  it('应原样返回传入的 map', () => {
    const map = { A: 'a', B: { label: 'b', order: 1 } };
    expect(createFilterMap(map)).toBe(map);
  });
});

describe('isFilter / isDefaultFilter', () => {
  it('isFilter 应识别 createFilter 创建的实例', () => {
    const filter = createFilter({ A: 'a' });
    expect(isFilter(filter)).toBe(true);
    expect(isFilter({})).toBeFalsy();
    expect(isFilter(null)).toBeFalsy();
    expect(isFilter(() => {})).toBeFalsy();
  });

  it('isDefaultFilter 默认 filter 为 true，自定义 filter 为 false', () => {
    const defaultFilter = createFilter({ A: 'a' });
    const customFilter = createFilter({ A: 'a' }, null, {
      filter: (v: string) => v,
    });
    expect(isDefaultFilter(defaultFilter)).toBe(true);
    expect(isDefaultFilter(customFilter)).toBe(false);
  });

  it('isDefaultFilter 对非 filter 应返回 false', () => {
    expect(isDefaultFilter({})).toBe(false);
    expect(isDefaultFilter(null)).toBeFalsy();
  });
});

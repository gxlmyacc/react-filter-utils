import { createFilter } from 'react-filter-utils';

// Numeric map keys need an explicit value to keep list values numeric.
export const statusFilter = createFilter({
  1: { label: '启用', value: 1, category: 'available', color: 'green' },
  2: { label: '禁用', value: 2, category: 'unavailable', color: 'gray' },
}, { ACTIVE: 1, DISABLED: 2 }, { enhance: true });

export const selected = statusFilter.createList(item => item.category === 'available');
export const active = statusFilter.itemByValue(statusFilter.ACTIVE);
export const enabled = statusFilter.itemByLabel('启用');
export const available = statusFilter.itemBy('category', 'available');
export const groups = statusFilter.groupBy('category');
export const labels = statusFilter.labelsByValues([1, 99, 2]); // 启用,,禁用
export const compactLabels = statusFilter.labelsByValues([1, 99, 2], {
  separator: '、', ignoreMissing: true,
}); // 启用、禁用
export const color = statusFilter.propBy(1, 'color', 'black');
export const labelColor = statusFilter.propBy('启用', 'color', 'black');
export const activeColor = statusFilter.propByValue(1, 'color', 'black');
export const disabledColor = statusFilter.propByLabel('禁用', 'color', 'black');

// onWalkListItem replaces the entry. onGetList defines the public list shape.
export const converted = createFilter({ A: { label: 'A', value: 1 } }, null, {
  enhance: true,
  onWalkListItem: item => ({ ...item, disabled: false }),
  onGetList: list => list.map(item => ({ ...item, value: String(item.value) })),
});
export const convertedItem = converted.itemByValue('1');
export const convertedList = converted.createList(item => !item.disabled);

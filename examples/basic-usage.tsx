import React, { useState } from 'react';
import { Select, Card, Space, Typography } from 'antd';
import { createFilter } from 'react-filter-utils';

const { Title, Text } = Typography;

// 1. 基础状态过滤器
const statusMap = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'Pending Review',
  DELETED: 'Deleted'
};

const statusFilter = createFilter(statusMap);

// 2. 带值映射的过滤器
const priorityMap = {
  HIGH: 'High Priority',
  MEDIUM: 'Medium Priority',
  LOW: 'Low Priority'
};

const priorityValueMap = {
  HIGH: '1',
  MEDIUM: '2',
  LOW: '3'
};

const priorityFilter = createFilter(priorityMap, priorityValueMap);

// 3. 复杂对象映射
const categoryMap = {
  TECH: {
    label: 'Technology',
    order: 1,
    color: '#1890ff',
    icon: '💻'
  },
  DESIGN: {
    label: 'Design',
    order: 2,
    color: '#52c41a',
    icon: '🎨'
  },
  BUSINESS: {
    label: 'Business',
    order: 3,
    color: '#faad14',
    icon: '💼'
  }
};

const categoryFilter = createFilter(categoryMap);

// 4. 带外部方法的过滤器
const roleMap = {
  ADMIN: 'Administrator',
  USER: 'Regular User',
  GUEST: 'Guest User'
};

const roleFilter = createFilter(roleMap, null, {
  external: {
    isAdmin(value: string) {
      return value === this.ADMIN;
    },
    getRoleLevel(value: string) {
      const levels = { ADMIN: 3, USER: 2, GUEST: 1 };
      return levels[value as keyof typeof levels] || 0;
    },
    logRoleChange(value: string) {
      console.log(`Role changed to: ${this(value)}`);
    }
  }
});

function BasicUsageExample() {
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [role, setRole] = useState('');

  const handleRoleChange = (value: string) => {
    setRole(value);
    roleFilter.logRoleChange(value);
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>React Filter Utils - Basic Usage</Title>

      {/* 基础状态选择器 */}
      <Card title="1. Basic Status Filter" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Select Status:</Text>
          <Select
            value={status}
            onChange={setStatus}
            placeholder="Choose status"
            style={{ width: 200 }}
          >
            {statusFilter.list.map(item => (
              <Select.Option key={item.value} value={item.value}>
                {item.label}
              </Select.Option>
            ))}
          </Select>
          <Text>Selected: <strong>{statusFilter(status)}</strong></Text>
          <Text type="secondary">
            Available values: {Object.keys(statusFilter.map).join(', ')}
          </Text>
        </Space>
      </Card>

      {/* 优先级选择器 */}
      <Card title="2. Priority Filter with Value Mapping" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Select Priority:</Text>
          <Select
            value={priority}
            onChange={setPriority}
            placeholder="Choose priority"
            style={{ width: 200 }}
          >
            {priorityFilter.list.map(item => (
              <Select.Option key={item.value} value={item.value}>
                {item.label}
              </Select.Option>
            ))}
          </Select>
          <Text>Selected: <strong>{priorityFilter(priority)}</strong></Text>
          <Text type="secondary">
            Internal value: {priorityFilter.valueMap[priority as keyof typeof priorityValueMap]}
          </Text>
        </Space>
      </Card>

      {/* 分类选择器 */}
      <Card title="3. Category Filter with Complex Objects" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Select Category:</Text>
          <Select
            value={category}
            onChange={setCategory}
            placeholder="Choose category"
            style={{ width: 200 }}
          >
            {categoryFilter.list.map(item => (
              <Select.Option key={item.value} value={item.value}>
                <span style={{ color: item.color }}>
                  {item.icon} {item.label}
                </span>
              </Select.Option>
            ))}
          </Select>
          <Text>Selected: <strong>{categoryFilter(category)}</strong></Text>
          {category && (
            <Text type="secondary">
              Order: {categoryFilter.list.find(item => item.value === category)?.order}
            </Text>
          )}
        </Space>
      </Card>

      {/* 角色选择器 */}
      <Card title="4. Role Filter with External Methods" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Select Role:</Text>
          <Select
            value={role}
            onChange={handleRoleChange}
            placeholder="Choose role"
            style={{ width: 200 }}
          >
            {roleFilter.list.map(item => (
              <Select.Option key={item.value} value={item.value}>
                {item.label}
              </Select.Option>
            ))}
          </Select>
          <Text>Selected: <strong>{roleFilter(role)}</strong></Text>
          {role && (
            <Space>
              <Text type="secondary">
                Is Admin: {roleFilter.isAdmin(role) ? 'Yes' : 'No'}
              </Text>
              <Text type="secondary">
                Level: {roleFilter.getRoleLevel(role)}
              </Text>
            </Space>
          )}
        </Space>
      </Card>

      {/* 过滤器信息展示 */}
      <Card title="Filter Information" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>Status Filter:</Text>
          <Text type="secondary">
            Map: {JSON.stringify(statusFilter.map)}
          </Text>
          <Text type="secondary">
            List: {JSON.stringify(statusFilter.list.map(item => ({ value: item.value, label: item.label })))}
          </Text>

          <Text strong>Priority Filter:</Text>
          <Text type="secondary">
            Value Map: {JSON.stringify(priorityFilter.valueMap)}
          </Text>

          <Text strong>Category Filter:</Text>
          <Text type="secondary">
            Items with order: {categoryFilter.list.length}
          </Text>
        </Space>
      </Card>
    </Space>
  );
}

export default BasicUsageExample;

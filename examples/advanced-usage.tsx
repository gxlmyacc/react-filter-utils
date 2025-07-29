import React, { useState, useEffect } from 'react';
import { createFilter } from 'react-filter-utils';

// 1. 自定义过滤器函数
const customStatusMap = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'Pending Review',
  DELETED: 'Deleted'
};

const customFilter = (value: string, defaultLabel: string = 'Unknown') => {
  if (!value) return 'No Status';
  if (value === 'DELETED') return '❌ Deleted';
  return customStatusMap[value as keyof typeof customStatusMap] || defaultLabel;
};

const customStatusFilter = createFilter(customStatusMap, null, {
  filter: customFilter
});

// 2. 带排序和自定义处理的过滤器
const priorityMap = {
  HIGH: {
    label: 'High Priority',
    order: 1,
    color: '#ff4d4f',
    icon: '🔥',
    weight: 100
  },
  MEDIUM: {
    label: 'Medium Priority',
    order: 2,
    color: '#faad14',
    icon: '⚡',
    weight: 50
  },
  LOW: {
    label: 'Low Priority',
    order: 3,
    color: '#52c41a',
    icon: '📌',
    weight: 10
  }
};

const priorityFilter = createFilter(priorityMap, null, {
  onWalkListItem: (item, index) => ({
    ...item,
    disabled: item.value === 'LOW',
    tooltip: `Priority ${index + 1}: ${item.label}`,
    badge: item.weight > 50 ? 'Important' : 'Normal'
  }),
  onGetList: list =>
    // 过滤掉低优先级选项
    list.filter(item => item.value !== 'LOW')

});

// 3. 动态外部方法
const roleMap = {
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  USER: 'Regular User',
  GUEST: 'Guest User'
};

const roleFilter = createFilter(roleMap, null, {
  external(filter) {
    return {
      isAdmin(value: string) {
        return value === this.ADMIN;
      },
      isManager(value: string) {
        return value === this.MANAGER;
      },
      hasPermission(value: string, requiredRole: string) {
        const levels = { ADMIN: 4, MANAGER: 3, USER: 2, GUEST: 1 };
        const userLevel = levels[value as keyof typeof levels] || 0;
        const requiredLevel = levels[requiredRole as keyof typeof levels] || 0;
        return userLevel >= requiredLevel;
      },
      getRoleHierarchy() {
        return this.list.map(item => ({
          role: item.value,
          label: item.label,
          level: this.hasPermission(item.value, 'ADMIN') ? 'High' : 'Low'
        }));
      }
    };
  }
});

// 4. 表单验证过滤器
const validationMap = {
  REQUIRED: 'This field is required',
  EMAIL: 'Please enter a valid email address',
  MIN_LENGTH: 'Minimum length is {min} characters',
  MAX_LENGTH: 'Maximum length is {max} characters',
  PATTERN: 'Please match the required pattern',
  UNIQUE: 'This value must be unique'
};

const validationFilter = createFilter(validationMap, null, {
  external: {
    getMessage(type: string, field: string = 'field', params: Record<string, any> = {}) {
      let message = this(type);

      // 替换字段名
      message = message.replace('field', field);

      // 替换参数
      Object.keys(params).forEach(key => {
        message = message.replace(`{${key}}`, params[key]);
      });

      return message;
    },

    validateEmail(email: string) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },

    validateLength(value: string, min: number, max: number) {
      if (value.length < min) {
        return this.getMessage('MIN_LENGTH', 'value', { min });
      }
      if (value.length > max) {
        return this.getMessage('MAX_LENGTH', 'value', { max });
      }
      return null;
    }
  }
});

// 5. 多语言过滤器
const languageMap = {
  EN: { label: 'English', code: 'en', flag: '🇺🇸', rtl: false },
  ES: { label: 'Español', code: 'es', flag: '🇪🇸', rtl: false },
  FR: { label: 'Français', code: 'fr', flag: '🇫🇷', rtl: false },
  DE: { label: 'Deutsch', code: 'de', flag: '🇩🇪', rtl: false },
  AR: { label: 'العربية', code: 'ar', flag: '🇸🇦', rtl: true },
  HE: { label: 'עברית', code: 'he', flag: '🇮🇱', rtl: true }
};

const languageFilter = createFilter(languageMap, null, {
  reverseList: false,
  onWalkListItem: item => ({
    ...item,
    displayText: `${item.flag} ${item.label}`,
    direction: item.rtl ? 'rtl' : 'ltr'
  }),
  onGetList: list => {
    // 将RTL语言排在后面
    const ltrLanguages = list.filter(item => !item.rtl);
    const rtlLanguages = list.filter(item => item.rtl);
    return [...ltrLanguages, ...rtlLanguages];
  },
  external: {
    getCurrentLanguage() {
      return navigator.language.split('-')[0];
    },
    isRTL(code: string) {
      const language = this.list.find(item => item.code === code);
      return language?.rtl || false;
    },
    getSupportedLanguages() {
      return this.list.map(item => item.code);
    }
  }
});

// 6. 数据表格过滤器
const tableFilterMap = {
  NAME: { label: 'Name', field: 'name', sortable: true },
  EMAIL: { label: 'Email', field: 'email', sortable: true },
  STATUS: { label: 'Status', field: 'status', sortable: false },
  CREATED_AT: { label: 'Created At', field: 'createdAt', sortable: true },
  UPDATED_AT: { label: 'Updated At', field: 'updatedAt', sortable: true }
};

const tableFilter = createFilter(tableFilterMap, null, {
  external: {
    getSortableColumns() {
      return this.list.filter(item => item.sortable);
    },
    getColumnField(column: string) {
      const item = this.list.find(item => item.value === column);
      return item?.field;
    },
    formatColumnValue(column: string, value: any) {
      const item = this.list.find(item => item.value === column);
      if (!item) return value;

      // 根据列类型格式化值
      switch (item.field) {
        case 'createdAt':
        case 'updatedAt':
          return new Date(value).toLocaleDateString();
        case 'email':
          return value.toLowerCase();
        default:
          return value;
      }
    }
  }
});

// React组件示例
function AdvancedUsageExample() {
  const [customStatus, setCustomStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [role, setRole] = useState('');
  const [validationType, setValidationType] = useState('');
  const [language, setLanguage] = useState('');
  const [tableColumn, setTableColumn] = useState('');

  useEffect(() => {
    // 演示外部方法调用
    if (role) {
      console.log('Role hierarchy:', roleFilter.getRoleHierarchy());
    }

    if (language) {
      console.log('Is RTL:', languageFilter.isRTL(language));
    }
  }, [role, language]);

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h1>Advanced Usage Examples</h1>

      <div style={{ marginBottom: '20px' }}>
        <h3>1. Custom Filter Function</h3>
        <select value={customStatus} onChange={e => setCustomStatus(e.target.value)}>
          <option value="">Select Status</option>
          {customStatusFilter.list.map(item => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <p>Selected: {customStatusFilter(customStatus)}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>2. Priority Filter with Custom Processing</h3>
        <select value={priority} onChange={e => setPriority(e.target.value)}>
          <option value="">Select Priority</option>
          {priorityFilter.list.map(item => (
            <option
              key={item.value}
              value={item.value}
              disabled={item.disabled}
              title={item.tooltip}
            >
              {item.icon} {item.label} {item.badge && `(${item.badge})`}
            </option>
          ))}
        </select>
        <p>Selected: {priorityFilter(priority)}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>3. Role Filter with Dynamic Methods</h3>
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="">Select Role</option>
          {roleFilter.list.map(item => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        {role && (
          <div>
            <p>Selected: {roleFilter(role)}</p>
            <p>Is Admin: {roleFilter.isAdmin(role) ? 'Yes' : 'No'}</p>
            <p>Can manage users: {roleFilter.hasPermission(role, 'MANAGER') ? 'Yes' : 'No'}</p>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>4. Validation Filter</h3>
        <select value={validationType} onChange={e => setValidationType(e.target.value)}>
          <option value="">Select Validation Type</option>
          {validationFilter.list.map(item => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        {validationType && (
          <div>
            <p>Message: {validationFilter(validationType)}</p>
            <p>Custom message: {validationFilter.getMessage(validationType, 'username', { min: 6 })}</p>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>5. Language Filter</h3>
        <select value={language} onChange={e => setLanguage(e.target.value)}>
          <option value="">Select Language</option>
          {languageFilter.list.map(item => (
            <option key={item.value} value={item.value}>
              {item.displayText}
            </option>
          ))}
        </select>
        {language && (
          <div>
            <p>Selected: {languageFilter(language)}</p>
            <p>Direction: {languageFilter.list.find(item => item.value === language)?.direction}</p>
            <p>Current browser language: {languageFilter.getCurrentLanguage()}</p>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>6. Table Column Filter</h3>
        <select value={tableColumn} onChange={e => setTableColumn(e.target.value)}>
          <option value="">Select Column</option>
          {tableFilter.list.map(item => (
            <option key={item.value} value={item.value}>
              {item.label} {item.sortable && '(Sortable)'}
            </option>
          ))}
        </select>
        {tableColumn && (
          <div>
            <p>Selected: {tableFilter(tableColumn)}</p>
            <p>Field: {tableFilter.getColumnField(tableColumn)}</p>
            <p>Sortable: {tableFilter.list.find(item => item.value === tableColumn)?.sortable ? 'Yes' : 'No'}</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f5f5f5' }}>
        <h3>Filter Information</h3>
        <p><strong>Custom Status Filter:</strong> Uses custom filter function</p>
        <p><strong>Priority Filter:</strong> Has custom processing and filtering</p>
        <p><strong>Role Filter:</strong> Includes dynamic external methods</p>
        <p><strong>Validation Filter:</strong> Supports parameterized messages</p>
        <p><strong>Language Filter:</strong> Handles RTL languages and custom ordering</p>
        <p><strong>Table Filter:</strong> Manages table column metadata</p>
      </div>
    </div>
  );
}

export default AdvancedUsageExample;

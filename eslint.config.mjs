import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      '**/node_modules/**',
      '**/cjs/**',
      '**/es/**',
      '**/types/**',
      '**/coverage/**',
    ],
  },
  {
    rules: {
      curly: ['error', 'all'],
      indent: ['error', 2, { SwitchCase: 1 }],
      'brace-style': ['error', '1tbs', { allowSingleLine: false }],
    },
  },
  {
    files: ['src/**/*.ts', 'tests/**/*.ts', 'examples/**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.typecheck.json', './examples/tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
  {
    files: ['*.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { module: 'readonly', process: 'readonly' },
    },
  },
);

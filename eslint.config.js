import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  // Ignore build output and deps
  { ignores: ['dist', 'node_modules', '.vite'] },

  // TypeScript + React rules for all source files
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // React Hooks — enforce rules of hooks, exhaustive deps
      ...reactHooks.configs.recommended.rules,

      // React Refresh — warn if non-component exports would break HMR
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // TypeScript — keep strict but allow some common patterns
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // General quality rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
    },
  },

  // Disable all Prettier-conflicting ESLint formatting rules (must be last)
  prettierConfig,
)

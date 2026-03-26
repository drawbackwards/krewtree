import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import reactPlugin from 'eslint-plugin-react'
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  // Ignore build output and deps
  { ignores: ['dist', 'node_modules', '.vite', '.claude'] },

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
      react: reactPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // React Hooks — enforce rules of hooks, exhaustive deps
      ...reactHooks.configs.recommended.rules,

      // React Refresh — warn if non-component exports would break HMR
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // React — catch missing keys, jsx-no-target-blank, etc.
      'react/jsx-key': 'error',
      'react/jsx-no-target-blank': 'error',
      'react/no-array-index-key': 'warn',
      'react/self-closing-comp': 'warn',

      // TypeScript — keep strict but allow some common patterns
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // General quality rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',

      // Design token enforcement — ban raw hex color strings outside token files.
      // Use --kt-* CSS custom properties (var(--kt-...)) or import from src/tokens/colors.ts instead.
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]",
          message: "Raw hex color detected. Use a --kt-* CSS token (var(--kt-...)) or import from src/tokens/colors.ts instead.",
        },
      ],
    },
  },

  // These files are exempt from the hex color rule:
  // - colors.ts: IS the token source of truth
  // - App.tsx: color swatch documentation
  // - mock.ts: placeholder data, will be replaced by API
  // - industries.ts: static data file — each industry has a specific brand color code
  // - icons/index.tsx: SVG brand icon library — paths use exact brand colors as fill attributes
  // - landing/sections.tsx: contains Regulix brand SVG logo with exact brand colors
  {
    files: [
      '**/tokens/colors.ts',
      '**/App.tsx',
      '**/data/mock.ts',
      '**/data/industries.ts',
      '**/icons/index.tsx',
      '**/landing/sections.tsx',
    ],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },

  // Disable all Prettier-conflicting ESLint formatting rules (must be last)
  prettierConfig,
)

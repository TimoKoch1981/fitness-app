import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    plugins: {
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Allow hooks & constants alongside components (feature-based structure)
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Downgrade to warn: any is sometimes needed for Supabase/API responses
      '@typescript-eslint/no-explicit-any': 'warn',
      // Prefix unused vars with _ to indicate intentionally unused
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // React Compiler rules (react-hooks v7) — warn for now, fix incrementally
      // These patterns (setState in useEffect, Date.now() in render) are common
      // in React 18/19 and only become issues with the React Compiler.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
])

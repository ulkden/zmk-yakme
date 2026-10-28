// ESLint flat config. Formatting is left to Prettier (eslint-config-prettier turns off clashing rules).
import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['node_modules/', 'test-results/', 'playwright-report/'] },
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: 2024, sourceType: 'module', globals: globals.browser },
    rules: {
      // Project rule: keep functions small and readable.
      'max-lines-per-function': ['error', { max: 100, skipBlankLines: true, skipComments: true }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none', ignoreRestSiblings: true }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    files: ['tests/**', 'e2e/**', '*.config.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    files: ['e2e/**', 'tests/**'],
    rules: { 'max-lines-per-function': 'off' },
  },
  prettier,
];

// ESLint flat config. Formatting is left to Prettier (eslint-config-prettier turns off clashing rules).
import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';

export default [
  { ignores: ['node_modules/', 'test-results/', 'playwright-report/'] },
  js.configs.recommended,
  comments.recommended,
  {
    // Stale disable comments are errors, so exceptions disappear when no longer needed.
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    languageOptions: { ecmaVersion: 2024, sourceType: 'module', globals: globals.browser },
    rules: {
      // Project rule: keep functions under 100 lines. This is a very strong default, not an
      // absolute: a longer function is allowed only with an inline exception that explains why
      // splitting it would make the code worse, e.g.
      //   // eslint-disable-next-line max-lines-per-function -- <justification>
      // The reason after `--` is mandatory (eslint-comments/require-description).
      'max-lines-per-function': ['error', { max: 100, skipBlankLines: true, skipComments: true }],
      '@eslint-community/eslint-comments/require-description': ['error', { ignore: [] }],
      '@eslint-community/eslint-comments/no-unlimited-disable': 'error',
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

import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['scenarios/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module', // switch to 'commonjs' if these use require()
      globals: globals.node,
    },
    rules: {
      eqeqeq: ['error', 'always'],
      'no-debugger': 'error',
      'no-console': 'off',
    },
  },
];
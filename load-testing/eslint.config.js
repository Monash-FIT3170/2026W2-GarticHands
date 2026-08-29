import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,

  {
    files: ['scenarios/**/*.js'],

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',

      globals: {
        ...globals.node,

        // k6 globals
        __VU: 'readonly',
        __ITER: 'readonly',
      },
    },

    rules: {
      eqeqeq: ['error', 'always'],
      'no-debugger': 'error',
      'no-console': 'off',
    },
  },
];
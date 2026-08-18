import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    // Ignores linting on packages, coverage tests, generated outputs
    ignores: ['dist', 'node_modules', 'coverage'],
  },

  {
    extends: [
      // Loads Basic JS checks
      js.configs.recommended,

      // Activates recommended TS checks (especially with data types)
      ...tseslint.configs.recommendedTypeChecked,

      // Activates recommended React/JSX rules
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
    ],

    // Ensures affected files are all the .ts and .tsx files
    files: ['**/*.{ts,tsx}'],

    languageOptions: {
      // Selects the version of the scripting rules to be followed
      ecmaVersion: 'latest',

      // Tells the system the program runs in a browser
      globals: globals.browser,

      parserOptions: {
        // Allows type aware linting
        projectService: true,
        // Tells the Linting the root directory of where it should check
        tsconfigRootDir: import.meta.dirname,
      },
    },

    // Checks the version of react installed
    settings: {
      react: {
        version: 'detect',
      },
    },

    // Registering ESLint plug ins
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },

    // Spot for Gartic Hand Specific Rulesets
    rules: {
      // Uses React Hook recommended rules
      ...reactHooks.configs.recommended.rules,

      // Helps maintain React fast refresh capability without breaking the linting
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Generalised Code quality rules

      // Requires triple === or !== signs
      eqeqeq: ['error', 'always'],

      // Prevents debugger statements from remaining in live code
      'no-debugger': 'error',

      // If a value is declared and never change, needs to be a const
      'prefer-const': 'error',

      // Will allow console messages to pass without breaking linting but will notify developer
      'no-console': [
        'warn',
        {
          // Exception of the log message is a warning or error
          allow: ['warn', 'error'],
        },
      ],

      // Checks for when variables are made but never utilized
      '@typescript-eslint/no-unused-vars': [
        'warn', // Should change to error later but until everyone is used to it, leave as warn
        {
          // Allows parameters names and variables to be ignored from this check if they start with an _ (can be useful for some functions)
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },

  // prevents conflicts between prettier and ESLINT
  eslintConfigPrettier,
);

export default {
    "name": "gartichands",
    "version": "1.0.0",
    "private": true,
    "type": "module",
  
    extends: ['@commitlint/config-conventional'],

  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'refactor',
        'test',
        'chore',
      ],
    ],

    'scope-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
  },
}
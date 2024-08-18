import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      'no-unused-vars': 'off'
    }
  },
  {
    files: ['**/*-worker.js'],
    languageOptions: {
      globals: {
        ...globals.worker
      }
    }
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        ...vitest.environments.env.globals
      }
    }
  },
  {
    ignores: [
      '.DS_Store',
      'node_modules',
      'build',
      'dist',
      'coverage',
      '.vercel',
      '.env',
      '.env.*',
      '!.env.example',
      'pnpm-lock.yaml',
      'package-lock.json',
      'yarn.lock'
    ]
  }
];

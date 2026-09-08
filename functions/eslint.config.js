// Flat config for the Cloud Functions package.
//
// eslint 10 removed .eslintrc support entirely, so this replaces the old
// functions/.eslintrc.js one rule for one rule. It also has to exist as a file
// here rather than being inherited: eslint walks up looking for a flat config,
// and without this it finds the ROOT eslint.config.js, whose `ignores` list
// contains "functions/**". That is what made `npm run lint` in this directory
// a no-op that still exited non-zero.
const js = require('@eslint/js');
const globals = require('globals');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

module.exports = [
  {
    ignores: [
      'lib/**',
      'vendor/**',
      'eslint.config.js',
      'vitest.config.ts',
      // Copied in by the prebuild script from packages/, linted at their source.
      'src/shared/**',
      'src/scoring/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tsParser,
      // No `project`: every rule enabled here is from the non-type-checked
      // recommended set, and requiring the program made eslint fail on the
      // 17 files tsconfig.json excludes (the test suite) rather than lint them.
      globals: { ...globals.node, ...globals.es2021 },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // TypeScript already reports undefined identifiers, and the rule cannot
      // see type-only names. Same call the root config makes.
      'no-undef': 'off',
      // Same severity policy as the root config: rules that catch real bugs
      // are errors, formatting is a warning. This package had no working lint
      // at all (the old .eslintrc.js was never being read), so treating style
      // as an error would mean 949 reformats landing inside a dependency bump.
      quotes: ['warn', 'single', { avoidEscape: true }],
      indent: ['warn', 2],
      'max-len': ['warn', { code: 120 }],
    },
  },
];

// Flat ESLint config (ESLint 9). One config for the whole monorepo; `pnpm lint`
// runs `eslint .` from the root. Per-app refinements (browser globals for web,
// React Native globals for mobile) are added in their own milestones (M0.6).
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/*.tsbuildinfo',
      'docs/design/reference/**',
      'apps/mobile/ios/**',
      'apps/mobile/android/**',
      // CommonJS tooling configs that legitimately use require().
      '**/babel.config.js',
      '**/metro.config.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    // React Native loads bundled assets (fonts, images, …) via `require()` —
    // that's the idiom Metro understands, so allow it in the mobile app.
    files: ['apps/mobile/**/*.{ts,tsx}'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  prettier,
);

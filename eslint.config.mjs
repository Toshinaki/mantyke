import mantine from 'eslint-config-mantine';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/out/**',
      '**/*.{mjs,cjs,js,d.ts,d.mts}',
    ],
  },
  ...tseslint.configs.recommended,
  ...mantine,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'jsx-a11y/no-static-element-interactions': 'off',
    },
  },
];

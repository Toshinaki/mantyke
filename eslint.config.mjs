import mantine from 'eslint-config-mantine';
import tseslint from 'typescript-eslint';

export default [
  ...tseslint.configs.recommended,
  ...mantine,
  {
    ignores: ['**/*.{mjs,cjs,js,d.ts,d.mts}'],
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

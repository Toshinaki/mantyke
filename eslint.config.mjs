import mantine from 'eslint-config-mantine';
import reactHooks from 'eslint-plugin-react-hooks';
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

    plugins: {
      'react-hooks': reactHooks,
    },

    rules: {
      'jsx-a11y/no-static-element-interactions': 'off',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];

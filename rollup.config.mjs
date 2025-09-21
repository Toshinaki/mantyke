import path from 'node:path';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import { createGenerateScopedName } from 'hash-css-selector';
import banner from 'rollup-plugin-banner2';
import esbuild from 'rollup-plugin-esbuild';
import nodeExternals from 'rollup-plugin-node-externals';
import postcss from 'rollup-plugin-postcss';
import { getPackages } from './scripts/utils.mjs';

const packages = getPackages();

export default packages.map((pkg) => {
  const packagePath = path.join(process.cwd(), `./packages/${pkg}`);
  const outputDir = path.join(packagePath, 'dist');

  return {
    input: path.join(packagePath, 'src/index.ts'),
    output: [
      {
        format: 'es',
        entryFileNames: '[name].mjs',
        dir: path.join(outputDir, 'esm'),
        preserveModules: true,
        sourcemap: true,
      },
      {
        format: 'cjs',
        entryFileNames: '[name].cjs',
        dir: path.join(outputDir, 'cjs'),
        preserveModules: true,
        sourcemap: true,
      },
    ],
    plugins: [
      nodeExternals({
        packagePath: path.join(packagePath, 'package.json'),
      }),
      nodeResolve({ extensions: ['.ts', '.tsx', '.js', '.jsx'] }),
      esbuild({
        sourceMap: false,
        tsconfig: path.resolve(process.cwd(), 'tsconfig.build.json'),
      }),
      replace({ preventAssignment: true }),
      postcss({
        extract: true,
        modules: { generateScopedName: createGenerateScopedName('me') },
        minimize: true,
      }),
      banner((chunk) => {
        if (chunk.fileName !== 'index.js' && chunk.fileName !== 'index.mjs') {
          return "'use client';\n";
        }
        return undefined;
      }),
    ],
  };
});

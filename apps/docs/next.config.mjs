import createMDX from '@next/mdx';
import fs from 'fs-extra';
import signale from 'signale';

const withMDX = createMDX({
  options: {
    // Turbopack 只接受可序列化的配置，插件以包名字符串的形式传入，由 loader 自行加载
    rehypePlugins: ['rehype-slug'],
  },
});

let repository;

try {
  const packageJson = fs.readJsonSync('../../package.json');
  repository = packageJson.repository.url.split('/').at(-1).replace('.git', '');
} catch (e) {
  signale.log(e);
  signale.error('Failed to read repository field of package.json\n');
  process.exit(1);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? `/${repository}` : undefined,
  pageExtensions: ['ts', 'tsx', 'mdx'],
};

export default withMDX(nextConfig);

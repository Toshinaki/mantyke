import path from 'path';
import { generateDeclarations } from 'mantine-docgen-script';

const getComponentPath = (componentPath: string) =>
  path.join(process.cwd(), 'packages', componentPath);

generateDeclarations({
  componentsPaths: [getComponentPath('spotlight-image/src/spotlight-image.tsx')],
  tsConfigPath: path.join(process.cwd(), 'tsconfig.json'),
  outputPath: path.join(process.cwd(), 'apps/docs'),
});

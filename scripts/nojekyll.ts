import path from 'node:path';
import fs from 'fs-extra';

fs.writeFileSync(path.join(process.cwd(), 'apps/docs/out/.nojekyll'), '');

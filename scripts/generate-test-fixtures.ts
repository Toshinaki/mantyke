import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { ALL_FIXTURES, FIXTURE_DIR } from '../.storybook/fixtures';

const OUTPUT_DIR = path.join(process.cwd(), '.storybook/public', FIXTURE_DIR);
const DRAW_SCRIPT = path.join(process.cwd(), 'scripts/draw-test-fixture.js');
const DATA_URL_PREFIX = /^data:image\/jpeg;base64,/;

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ channel: 'chromium' });
  const page = await browser.newPage();
  await page.addScriptTag({ path: DRAW_SCRIPT });

  for (const fixture of ALL_FIXTURES) {
    const dataUrl = await page.evaluate<string>(
      `window.drawTestFixture(${JSON.stringify(fixture)})`
    );
    const buffer = Buffer.from(dataUrl.replace(DATA_URL_PREFIX, ''), 'base64');
    const file = path.join(OUTPUT_DIR, `${fixture.name}.jpg`);
    await fs.writeFile(file, buffer);
    process.stdout.write(`${fixture.name}.jpg  ${(buffer.length / 1024).toFixed(0)} KB\n`);
  }

  await browser.close();
}

main();

/**
 * Rasterises the SVG source art into the PNG formats that actually get used
 * in the wild: social previews refuse SVG, and Android install prompts
 * want square PNGs.
 *
 * Run: node tools/generate-images.mjs
 */
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');

/** Render an SVG string at a given size and return PNG bytes. */
async function raster(browser, svg, width, height) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<!doctype html><html><body style="margin:0;width:${width}px;height:${height}px;overflow:hidden">
       <div style="width:${width}px;height:${height}px">${svg}</div>
     </body></html>`,
    { waitUntil: 'networkidle' }
  );
  const buffer = await page.screenshot({ type: 'png', omitBackground: false });
  await page.close();
  return buffer;
}

const browser = await chromium.launch();
const written = [];

// --- Social preview ------------------------------------------------------
{
  const svg = await readFile(join(pub, 'og-image.svg'), 'utf8');
  const png = await raster(browser, svg, 1200, 630);
  await writeFile(join(pub, 'og-image.png'), png);
  written.push(['og-image.png', png.length, '1200x630 social preview']);
}

// --- App / PWA icons -----------------------------------------------------
{
  const svg = await readFile(join(pub, 'icons', 'icon-512.svg'), 'utf8');
  await mkdir(join(pub, 'icons'), { recursive: true });

  for (const size of [72, 96, 128, 144, 152, 180, 192, 384, 512]) {
    const png = await raster(browser, svg, size, size);
    const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
    await writeFile(join(pub, 'icons', name), png);
    written.push([`icons/${name}`, png.length, `${size}x${size}`]);
  }
}

// --- Favicons ------------------------------------------------------------
{
  const svg = await readFile(join(pub, 'favicon.svg'), 'utf8');
  for (const size of [16, 32, 48]) {
    const png = await raster(browser, svg, size, size);
    await writeFile(join(pub, `favicon-${size}.png`), png);
    written.push([`favicon-${size}.png`, png.length, `${size}x${size}`]);
  }
}

await browser.close();

console.log('\nGenerated:');
for (const [name, bytes, note] of written) {
  console.log(`  ${name.padEnd(30)} ${(bytes / 1024).toFixed(1).padStart(7)} KB  ${note}`);
}

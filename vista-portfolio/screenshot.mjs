import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('./dist/', import.meta.url));
const PORT = 4322;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/png', '.jpeg': 'image/png', '.webp': 'image/png', '.mp4': 'video/mp4', '.webm': 'video/webm', '.pdf': 'application/pdf', '.json': 'application/json' };

const server = createServer(async (req, res) => {
  try {
    let p = join(DIST, normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    if ((await stat(p).catch(() => null))?.isDirectory()) p = join(p, 'index.html');
    const info = await stat(p);
    const range = req.headers.range;
    if (range && /^bytes=/.test(range)) {
      const [a, b] = range.replace('bytes=', '').split('-');
      const start = Number(a) || 0;
      const end = b ? Number(b) : info.size - 1;
      res.writeHead(206, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream', 'content-range': `bytes ${start}-${end}/${info.size}`, 'accept-ranges': 'bytes', 'content-length': end - start + 1 });
      return createReadStream(p, { start, end }).pipe(res);
    }
    res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream', 'content-length': info.size, 'accept-ranges': 'bytes' });
    createReadStream(p).pipe(res);
  } catch { res.writeHead(404).end('nope'); }
});
await new Promise((r) => server.listen(PORT, r));

const browser = await chromium.launch();

async function shot(name, width, height, prep) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[role="toolbar"]');
  await page.waitForTimeout(1000);
  if (prep) await prep(page);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `shots/${name}.png` });
  console.log('wrote shots/' + name + '.png');
  await page.close();
}

const OUT = fileURLToPath(new URL('./shots/', import.meta.url));

// Open an app by its Start-menu entry (works even when it has no desktop icon).
async function openViaStart(page, label) {
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  const menu = page.getByRole('menu', { name: 'Start menu' });
  await menu.waitFor({ timeout: 3000 });
  await menu.getByLabel('Search programs and files').fill(label);
  await page.waitForTimeout(150);
  await menu.getByText(label, { exact: true }).first().click();
  await page.waitForTimeout(450);
}

await shot('01-welcome', 1440, 900);
await shot('02-desktop-start-menu', 1440, 900, async (page) => {
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.waitForTimeout(400);
});
await shot('03-two-windows', 1440, 900, async (page) => {
  await page.locator('[data-desktop-icon="roid-rager"]').dblclick();
  await page.waitForTimeout(400);
  await openViaStart(page, 'Portfolio');
});
await shot('04-about', 1440, 900, async (page) => {
  await page.locator('[data-desktop-icon="about"]').dblclick();
  await page.waitForTimeout(500);
});
await shot('05-resume', 1440, 900, async (page) => {
  await page.locator('[data-desktop-icon="resume"]').dblclick();
  await page.waitForTimeout(500);
});
await shot('06-voxel-code', 1440, 900, async (page) => {
  await page.locator('[data-desktop-icon="voxel-terrain"]').dblclick();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'How it works' }).click();
  await page.waitForTimeout(2500);
});
await shot('07-contact', 1440, 900, async (page) => {
  await page.locator('[data-desktop-icon="contact"]').dblclick();
  await page.waitForTimeout(500);
});
await shot('08-settings', 1440, 900, async (page) => {
  await page.getByRole('button', { name: 'Settings' }).first().click();
  await page.waitForTimeout(500);
});
await shot('09-flip3d', 1440, 900, async (page) => {
  await page.locator('[data-desktop-icon="roid-rager"]').dblclick();
  await page.waitForTimeout(300);
  await openViaStart(page, 'Portfolio');
  await page.getByRole('button', { name: 'Flip 3D' }).click();
  await page.waitForTimeout(700);
});
await shot('10-mobile', 390, 844);
await shot('11-tablet', 900, 700);

await browser.close();
server.close();
console.log('done ->', OUT);

/**
 * Headless smoke test: boots the app, exercises the shell, and fails loudly
 * on any console error, page error or failed request.
 *
 * Run with:  node smoke-test.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('./dist/', import.meta.url));
const PORT = 4319;

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/png',
  '.jpeg': 'image/png',
  '.webp': 'image/png',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let path = join(DIST, normalize(decodeURIComponent(url.pathname)));
    if ((await stat(path).catch(() => null))?.isDirectory()) path = join(path, 'index.html');

    const info = await stat(path);
    const type = MIME[extname(path)] ?? 'application/octet-stream';
    const range = req.headers.range;

    // Media needs range support or the browser aborts the request.
    if (range && /^bytes=/.test(range)) {
      const [startRaw, endRaw] = range.replace('bytes=', '').split('-');
      const start = Number(startRaw) || 0;
      const end = endRaw ? Number(endRaw) : info.size - 1;
      res.writeHead(206, {
        'content-type': type,
        'content-range': `bytes ${start}-${end}/${info.size}`,
        'accept-ranges': 'bytes',
        'content-length': end - start + 1,
      });
      createReadStream(path, { start, end }).pipe(res);
      return;
    }

    res.writeHead(200, {
      'content-type': type,
      'content-length': info.size,
      'accept-ranges': 'bytes',
    });
    createReadStream(path).pipe(res);
  } catch {
    res.writeHead(404).end('not found');
  }
});

await new Promise((r) => server.listen(PORT, r));

const problems = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on('console', (msg) => {
  if (msg.type() === 'error') problems.push(`console.error: ${msg.text()}`);
  if (msg.type() === 'warning' && /React|key|validateDOM/i.test(msg.text())) {
    problems.push(`console.warn: ${msg.text()}`);
  }
});
page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
const MEDIA = /\.(mp4|webm|mov|m4v)$/i;

page.on('requestfailed', (req) => {
  const url = req.url();
  if (url.includes('favicon')) return;
  // Chromium routinely aborts in-flight media range requests when an element
  // unmounts or navigates. That is not an app fault.
  if (MEDIA.test(url) && req.failure()?.errorText === 'net::ERR_ABORTED') return;
  problems.push(`requestfailed: ${url} — ${req.failure()?.errorText}`);
});
page.on('response', (res) => {
  if (res.status() >= 400 && !res.url().includes('favicon')) {
    problems.push(`http ${res.status()}: ${res.url()}`);
  }
});

const step = async (name, fn) => {
  try {
    await fn();
    console.log(`  PASS  ${name}`);
  } catch (err) {
    problems.push(`step "${name}": ${err.message}`);
    console.log(`  FAIL  ${name} — ${err.message}`);
  }
};

console.log('\nVista desktop smoke test\n');

await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });

await step('boots past the splash screen', async () => {
  await page.waitForSelector('[role="toolbar"]', { timeout: 8000 });
});

await step('opens the Welcome Center automatically', async () => {
  await page.getByRole('dialog', { name: 'Welcome Center' }).waitFor({ timeout: 5000 });
});

await step('renders desktop icons', async () => {
  const count = await page.locator('[data-desktop-icon]').count();
  if (count < 5) throw new Error(`only ${count} icons`);
});

await step('opens a project from the desktop', async () => {
  await page.locator('[data-desktop-icon="roid-rager"]').dblclick();
  await page.getByRole('dialog', { name: 'Roid Rager' }).waitFor({ timeout: 5000 });
});

await step('drags the window and it actually moves', async () => {
  const win = page.getByRole('dialog', { name: 'Roid Rager' });
  const before = await win.boundingBox();
  const bar = win.locator('[data-window-drag]');
  const barBox = await bar.boundingBox();
  await page.mouse.move(barBox.x + 200, barBox.y + barBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(barBox.x + 320, barBox.y + 90, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(250);
  const after = await win.boundingBox();
  if (Math.abs(after.x - before.x) < 40 || Math.abs(after.y - before.y) < 30) {
    throw new Error(`window did not move (${JSON.stringify(before)} -> ${JSON.stringify(after)})`);
  }
});

await step('resizes the window from the bottom-right corner', async () => {
  const win = page.getByRole('dialog', { name: 'Roid Rager' });
  const before = await win.boundingBox();
  const box = await win.boundingBox();
  await page.mouse.move(box.x + box.width - 3, box.y + box.height - 3);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width + 120, box.y + box.height + 60, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  const after = await win.boundingBox();
  if (after.width - before.width < 60) {
    throw new Error(`width did not grow (${before.width} -> ${after.width})`);
  }
});

await step('Start menu search filters results', async () => {
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  const menu = page.getByRole('menu', { name: 'Start menu' });
  await menu.waitFor({ timeout: 3000 });
  await menu.getByLabel('Search programs and files').fill('voxel');
  await page.waitForTimeout(200);
  const items = await menu.locator('button', { hasText: 'Voxel' }).count();
  if (items === 0) throw new Error('search returned nothing for "voxel"');
  const ethics = await menu.locator('button', { hasText: 'Ethical' }).count();
  if (ethics !== 0) throw new Error('search did not filter out unrelated apps');
});

await step('opens an app from the Start menu search', async () => {
  await page.getByRole('menu', { name: 'Start menu' }).getByText('Voxel Terrain Generator').click();
  await page.getByRole('dialog', { name: 'Voxel Terrain Generator' }).waitFor({ timeout: 5000 });
});

await step('taskbar lists the running windows', async () => {
  const labels = await page.locator('[role="toolbar"] button[title]').allTextContents();
  if (!labels.some((l) => l.includes('Voxel'))) throw new Error('taskbar missing the window');
});

await step('minimise and restore from the taskbar', async () => {
  const win = page.getByRole('dialog', { name: 'Voxel Terrain Generator' });
  await win.locator('button[aria-label="Minimize"]').click();
  await page.waitForTimeout(350);
  if (await win.isVisible().catch(() => false)) throw new Error('window still visible after minimise');
  await page.locator('[role="toolbar"] button[title*="Voxel"]').click();
  await page.waitForTimeout(400);
  await win.waitFor({ timeout: 3000 });
});

await step('every Start-menu app opens without crashing', async () => {
  const labels = [
    'About Me',
    'Résumé',
    'Contact',
    'Settings',
    'Web Development',
    'Voxel Terrain Generator',
    'Totally Ethical Labs',
    'Roid Rager',
    'Portfolio',
  ];
  for (const label of labels) {
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    const menu = page.getByRole('menu', { name: 'Start menu' });
    await menu.waitFor({ timeout: 3000 });
    await menu.getByLabel('Search programs and files').fill(label);
    await page.waitForTimeout(150);
    await menu.getByText(label, { exact: true }).first().click();
    await page.waitForTimeout(320);
  }
  const stopped = await page.getByText('This window stopped responding').count();
  if (stopped > 0) throw new Error(`${stopped} window(s) hit the error boundary`);
});

await step('no black/empty desktop (wallpaper painted)', async () => {
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  if (bg === 'rgba(0, 0, 0, 0)' || bg === 'rgb(255, 255, 255)') {
    throw new Error(`body background looks wrong: ${bg}`);
  }
});

await step('survives a reload (no corrupt persisted windows)', async () => {
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('[role="toolbar"]', { timeout: 8000 });
  await page.getByRole('dialog', { name: 'Welcome Center' }).waitFor({ timeout: 5000 });
});

await step('mobile viewport renders full-screen windows', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  const win = page.getByRole('dialog', { name: 'Welcome Center' });
  const box = await win.boundingBox();
  if (box.width > 400) throw new Error(`window not full width on mobile: ${box.width}px`);
});

await browser.close();
server.close();

console.log('');
if (problems.length) {
  console.log(`FAILED — ${problems.length} problem(s):\n`);
  for (const p of [...new Set(problems)]) console.log(`  • ${p}`);
  process.exit(1);
} else {
  console.log('PASSED — no console errors, failed requests or step failures.\n');
}

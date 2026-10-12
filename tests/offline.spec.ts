import { openCase } from './helpers/cases';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { CASE_ORDER, CASE_RESULTS } from '../src/data/cases';

// Stop the actual origin as well as emulating offline: a worker must serve the
// previously unopened debug pages and assets without any reachable server.
async function serveBuild(mount: string, failFont = false, holdFonts = false) {
  const root = resolve('dist');
  let failing = failFont;
  let upgraded = false;
  let releaseFonts!: () => void;
  const fontGate = new Promise<void>(resolve => { releaseFonts = resolve; });
  const mime: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2' };
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url!, 'http://localhost').pathname);
      if (!pathname.startsWith(mount)) throw new Error('Outside mount');
      let relative = pathname.slice(mount.length);
      if (!relative || relative.endsWith('/')) relative += 'index.html';
      const path = resolve(root, relative);
      if (!path.startsWith(root + sep)) throw new Error('Outside build');
      if (failing && extname(path) === '.woff') {
        response.writeHead(503); response.end(); return;
      }
      if (holdFonts && extname(path) === '.woff') await fontGate;
      let body = await readFile(path);
      if (upgraded && relative === 'sw.js') {
        body = Buffer.from(body.toString().replace(/const version = "[^"]+";/, 'const version = "test-next-version";'));
      }
      response.writeHead(200, { 'Content-Type': mime[extname(path)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(body);
    } catch { response.writeHead(404); response.end(); }
  });
  await new Promise<void>(ready => server.listen(0, '127.0.0.1', ready));
  const address = server.address() as { port: number };
  const stop = async () => {
    releaseFonts();
    if (!server.listening) return;
    const closed = new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
    server.closeAllConnections();
    await closed;
  };
  return { url: `http://127.0.0.1:${address.port}${mount}`, stop, recover: () => { failing = false; }, upgrade: () => { upgraded = true; } };
}

async function openSettings(page: Page) {
  await expect(page.locator('.startup-screen')).toHaveCount(0);
  await page.keyboard.press('c');
  await expect(page.locator('#settings-modal')).toBeVisible();
}

for (const mount of ['/', '/biologia-forense/']) {
  test(`site completo e os dois modos do debug funcionam sem servidor em ${mount}`, async ({ page, context }, testInfo) => {
    const origin = await serveBuild(mount);
    const errors: string[] = [];
    context.on('page', tab => tab.on('pageerror', error => errors.push(error.message)));
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.goto(origin.url);
      await openSettings(page);
      await expect(page.locator('[data-offline]')).toHaveAttribute('data-offline', 'ready', { timeout: 60_000 });
      const popup = page.waitForEvent('popup');
      await page.locator('.settings-debug-link').click();
      const debug = await popup;
      await expect(debug.getByRole('heading', { name: 'Ferramentas de apoio' })).toBeVisible();
      await expect(debug.locator('[data-offline]')).toHaveAttribute('data-offline', 'ready');
      await page.keyboard.press('c');

      await context.setOffline(true);
      await origin.stop();
      await expect(debug.locator('[data-offline]')).toHaveText('Funcionando offline');
      await debug.getByRole('link', { name: 'Respostas dos casos', exact: true }).click();
      await expect(debug.getByRole('heading', { name: 'Gabarito Forense' })).toBeVisible();
      await expect(debug.locator('.suspect')).toHaveCount(4);
      expect((await debug.reload())!.fromServiceWorker()).toBe(true);
      await debug.getByRole('link', { name: 'Posições do DNA', exact: true }).click();
      await expect(debug.locator('#status')).toContainText('Pronto.', { timeout: 30_000 });
      await expect(debug.locator('[data-offline]')).toHaveText('Funcionando offline');
      await debug.screenshot({ path: testInfo.outputPath('debug-positions-offline.png') });
      await debug.getByRole('link', { name: 'Menu debug', exact: true }).click();
      await expect(debug.getByRole('heading', { name: 'Ferramentas de apoio' })).toBeVisible();
      await debug.getByRole('link', { name: 'Posições do DNA', exact: true }).click();
      await expect(debug.locator('#status')).toContainText('Pronto.');
      expect((await debug.reload())!.fromServiceWorker()).toBe(true);
      await expect(debug.locator('#status')).toContainText('Pronto.');
      await debug.close();

      expect((await page.reload())!.fromServiceWorker()).toBe(true);
      await expect(page.locator('.startup-screen')).toHaveCount(0);
      await page.locator('#open-dna-info-home').click();
      await expect(page.locator('#dna-3d-status')).toHaveClass(/hidden/);
      await expect(page.locator('#dna-webgl-fallback')).toBeHidden();
      await page.locator('#close-dna-info').click();
      for (const id of CASE_ORDER) {
        const result = CASE_RESULTS[id];
        await openCase(page, id);
        await page.locator('#open-pick').click();
        await page.getByRole('button', { name: `Marcar ${result.culprit} como suspeito`, exact: true }).click();
        await page.locator('#open-guess').click();
        await page.keyboard.type(result.code);
        await expect(page.locator('#done-view')).toBeVisible();
        await expect.poll(() => page.locator('#done-view img').evaluateAll(images => images.every(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))).toBe(true);
        await expect(page.locator('#culprit-name')).toContainText(result.culprit);
        await page.locator('#done-home').click();
      }
      await openSettings(page);
      await expect(page.locator('[data-offline]')).toHaveText('Funcionando offline');
      const offlinePopup = page.waitForEvent('popup');
      await page.locator('.settings-debug-link').click();
      const reopenedDebug = await offlinePopup;
      await expect(reopenedDebug.getByRole('heading', { name: 'Ferramentas de apoio' })).toBeVisible();
      await expect(reopenedDebug.locator('[data-offline]')).toHaveText('Funcionando offline');
      await reopenedDebug.goto(origin.url + 'debug?fair=1');
      await expect(reopenedDebug).toHaveURL(origin.url + 'debug/?fair=1');
      await reopenedDebug.getByRole('link', { name: 'Respostas dos casos', exact: true }).click();
      await expect(reopenedDebug).toHaveURL(origin.url + 'debug/gabarito.html');
      await expect(reopenedDebug.getByRole('heading', { name: 'Gabarito Forense' })).toBeVisible();
      await reopenedDebug.close();
      expect((await page.goto(origin.url + 'trabalho.html'))!.fromServiceWorker()).toBe(true);
      await expect(page.locator('.startup-screen')).toHaveCount(0);
      expect(errors).toEqual([]);
    } finally { await origin.stop(); }
  });
}

test('só confirma o offline com todos os arquivos e permite recuperar uma preparação com falha', async ({ page }) => {
  const origin = await serveBuild('/', true);
  try {
    await page.goto(origin.url);
    await openSettings(page);
    await expect(page.locator('[data-offline]')).toHaveAttribute('data-offline', 'error', { timeout: 60_000 });
    await expect(page.locator('[data-offline]')).not.toContainText('Pronto');
    origin.recover();
    await page.locator('[data-offline]').getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(page.locator('[data-offline]')).toHaveAttribute('data-offline', 'ready', { timeout: 60_000 });
    await origin.stop();
    expect((await page.reload())!.fromServiceWorker()).toBe(true);
    await expect(page.locator('.startup-screen')).toHaveCount(0);
  } finally { await origin.stop(); }
});

test('uma atualização aguarda as abas e mantém o site e o debug disponíveis offline', async ({ page, context }) => {
  const origin = await serveBuild('/');
  try {
    await page.goto(origin.url);
    await openSettings(page);
    await expect(page.locator('[data-offline]')).toHaveAttribute('data-offline', 'ready', { timeout: 60_000 });
    const debug = await context.newPage();
    await debug.goto(origin.url + 'debug/index.html');
    await expect(debug.locator('[data-offline]')).toHaveAttribute('data-offline', 'ready');
    origin.upgrade();
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())!.update(); });
    await expect.poll(() => page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting)), { timeout: 60_000 }).toBe(true);
    await context.setOffline(true);
    await origin.stop();
    expect((await page.reload())!.fromServiceWorker()).toBe(true);
    await expect(page.locator('.startup-screen')).toHaveCount(0);
    await debug.getByRole('link', { name: 'Posições do DNA', exact: true }).click();
    await expect(debug.locator('#status')).toContainText('Pronto.');
    await page.close();
    await debug.close();
    const reopened = await context.newPage();
    await reopened.goto(origin.url + 'debug/gabarito.html');
    await expect(reopened.getByRole('heading', { name: 'Gabarito Forense' })).toBeVisible();
    await expect(reopened.locator('[data-offline]')).toHaveText('Funcionando offline');
    await expect.poll(() => reopened.evaluate(() => caches.keys())).toEqual(['forensic-offline:' + origin.url + ':test-next-version']);
    await reopened.close();
  } finally { await origin.stop(); }
});

test('apagar dados offline limpa o cache, registro e preferências sem recriar dados pelas abas abertas', async ({ page, context }) => {
  const origin = await serveBuild('/');
  try {
    await page.goto(origin.url);
    await openSettings(page);
    await expect(page.locator('[data-offline]')).toHaveAttribute('data-offline', 'ready', { timeout: 60_000 });
    await page.evaluate(async () => {
      localStorage.setItem('forensic-dna-force-2d', 'true');
      sessionStorage.setItem('forensic-test', 'saved');
      localStorage.setItem('visitantes_totais', '25');
      localStorage.setItem('forensic-fair-statistics', JSON.stringify({ groups: '5', solved: '3', cases: { Faca: '5' } }));
      localStorage.setItem('unrelated-app', 'keep');
      await caches.open('unrelated-cache');
    });
    const popup = page.waitForEvent('popup');
    await page.locator('.settings-debug-link').click();
    const debug = await popup;
    await expect(debug.locator('[data-offline]')).toHaveAttribute('data-offline', 'ready');
    origin.upgrade();
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())!.update(); });
    await expect.poll(() => page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting)), { timeout: 60_000 }).toBe(true);
    await context.setOffline(true);
    await page.locator('#clear-offline-data').click();
    await expect(page.locator('[data-offline]')).toHaveAttribute('data-offline', 'cleared');
    await expect(debug.locator('[data-offline]')).toHaveAttribute('data-offline', 'cleared');
    await expect(page.locator('#clear-offline-data')).toBeDisabled();
    expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)).toBe(0);
    expect(await page.evaluate(() => caches.keys())).toEqual(['unrelated-cache']);
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['unrelated-app']);
    expect(await page.evaluate(() => Object.keys(sessionStorage).filter(key => key.startsWith('forensic-')))).toEqual([]);
    // Fetch from the still-open debug controller, then restore connectivity.
    await debug.evaluate(async () => { try { await fetch('./gabarito.html'); } catch {} });
    await context.setOffline(false);
    expect(await page.evaluate(() => caches.keys())).toEqual(['unrelated-cache']);
    await expect(debug.locator('[data-offline]')).toHaveAttribute('data-offline', 'cleared');
    await debug.close();
  } finally { await origin.stop(); }
});

test('apagar dados offline interrompe uma instalação que ainda está baixando arquivos', async ({ page }) => {
  const origin = await serveBuild('/', false, true);
  try {
    await page.goto(origin.url);
    await openSettings(page);
    await expect(page.locator('[data-offline]')).toHaveAttribute('data-offline', 'preparing');
    await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.installing?.state)).toBe('installing');
    await page.locator('#clear-offline-data').click();
    await expect(page.locator('[data-offline]')).toHaveAttribute('data-offline', 'cleared');
    expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)).toBe(0);
    expect(await page.evaluate(() => caches.keys())).toEqual([]);
    expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('forensic-')))).toEqual([]);
  } finally { await origin.stop(); }
});

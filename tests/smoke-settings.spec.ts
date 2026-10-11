import { expect, test, type Page } from '@playwright/test';
import { defaultSmokeSettings } from '../src/lib/smokeSettings';

interface SmokeMetrics {
  draws: { at: number; density: number; time: number }[];
  density: number;
  time: number;
  shaderCompiles: number;
}
declare global { interface Window { smokeMetrics: SmokeMetrics } }

async function openSettings(page: Page) {
  await page.keyboard.press('c');
  await expect(page.locator('#settings-modal')).toBeVisible();
}

async function instrumentSmoke(page: Page) {
  await page.addInitScript(() => {
    const metrics: SmokeMetrics = { draws: [], density: 0, time: 0, shaderCompiles: 0 };
    window.smokeMetrics = metrics;
    const prototype = WebGLRenderingContext.prototype;
    const names = new WeakMap<WebGLUniformLocation, string>();
    const isSmoke = (context: WebGLRenderingContext) => context.canvas instanceof HTMLCanvasElement && context.canvas.classList.contains('smoke');
    const getUniform = prototype.getUniformLocation;
    prototype.getUniformLocation = function (program, name) {
      const location = getUniform.call(this, program, name);
      if (location) names.set(location, name);
      return location;
    };
    const uniform = prototype.uniform1f;
    prototype.uniform1f = function (location, value) {
      if (isSmoke(this) && location) {
        if (names.get(location) === 'u_density') metrics.density = value;
        if (names.get(location) === 'u_time') metrics.time = value;
      }
      uniform.call(this, location, value);
    };
    const compile = prototype.compileShader;
    prototype.compileShader = function (shader) {
      if (isSmoke(this)) metrics.shaderCompiles++;
      compile.call(this, shader);
    };
    const draw = prototype.drawArrays;
    prototype.drawArrays = function (mode, first, count) {
      if (isSmoke(this)) {
        metrics.draws.push({ at: performance.now(), density: metrics.density, time: metrics.time });
        if (metrics.draws.length > 200) metrics.draws.shift();
      }
      draw.call(this, mode, first, count);
    };
  });
}

test('os controles começam nos valores originais, funcionam por teclado e abrem o debug', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.startup-screen')).toHaveCount(0);
  await openSettings(page);
  for (const key of ['fps', 'quality', 'strength', 'speed'] as const) {
    await expect(page.locator(`#smoke-${key}`)).toHaveValue(String(defaultSmokeSettings[key]));
  }
  const enabled = page.getByRole('switch', { name: 'Fumaça', exact: true });
  await expect(enabled).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Tab');
  await expect(enabled).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#smoke-fps')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#smoke-fps')).toHaveValue('45');
  await page.locator('.settings-reset').click();
  await expect(page.locator('#smoke-fps')).toHaveValue('40');
  const popup = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Abrir ferramentas de debug em uma nova aba' }).click();
  const debug = await popup;
  await expect(debug).toHaveURL(/\/debug\/index\.html$/);
  await expect(debug.getByRole('heading', { name: 'Ferramentas de apoio' })).toBeVisible();
  await debug.close();
});

test('FPS, qualidade, força e velocidade alteram o renderizador sem recompilar o shader', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await instrumentSmoke(page);
  await page.goto('/');
  await expect(page.locator('.startup-screen')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.smokeMetrics.draws.length)).toBeGreaterThan(2);
  const canvas = page.locator('canvas.smoke');
  const initialWidth = await canvas.evaluate(element => (element as HTMLCanvasElement).width);
  const initialCompiles = await page.evaluate(() => window.smokeMetrics.shaderCompiles);
  expect(await page.evaluate(() => window.smokeMetrics.density)).toBeCloseTo(.217);
  await openSettings(page);
  await page.locator('#smoke-quality').press('Home');
  await expect(page.locator('#smoke-quality')).toHaveValue('25');
  await expect.poll(() => canvas.evaluate(element => (element as HTMLCanvasElement).width)).toBe(Math.round(initialWidth / 4));
  await page.locator('#smoke-strength').press('End');
  await expect.poll(() => page.evaluate(() => window.smokeMetrics.density)).toBeCloseTo(1.55);
  await page.locator('#smoke-fps').press('Home');
  await expect(page.locator('#smoke-fps')).toHaveValue('5');
  await page.evaluate(() => { window.smokeMetrics.draws = []; });
  await expect.poll(() => page.evaluate(() => window.smokeMetrics.draws.length)).toBeGreaterThanOrEqual(4);
  const draws = await page.evaluate(() => window.smokeMetrics.draws);
  for (let i = 1; i < draws.length; i++) expect(draws[i].at - draws[i - 1].at).toBeGreaterThanOrEqual(198);
  const first = draws[0];
  const last = draws.at(-1)!;
  const speed = (last.time - first.time) / ((last.at - first.at) / 1000);
  expect(speed).toBeGreaterThan(.45);
  expect(speed).toBeLessThan(.63);
  await page.locator('#smoke-speed').press('Home');
  await expect(page.locator('#smoke-speed')).toHaveValue('0');
  const stoppedTime = await page.evaluate(() => window.smokeMetrics.time);
  await page.waitForTimeout(450);
  expect(await page.evaluate(() => window.smokeMetrics.time)).toBe(stoppedTime);
  await page.getByRole('switch', { name: 'Fumaça', exact: true }).click();
  await expect(canvas).toBeHidden();
  await page.locator('.settings-reset').click();
  await expect(canvas).toBeVisible();
  await expect.poll(() => canvas.evaluate(element => (element as HTMLCanvasElement).width)).toBe(initialWidth);
  expect(await page.evaluate(() => window.smokeMetrics.shaderCompiles)).toBe(initialCompiles);
  await page.screenshot({ path: testInfo.outputPath('smoke-settings-desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => canvas.evaluate(element => Math.max((element as HTMLCanvasElement).width, (element as HTMLCanvasElement).height))).toBe(720);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: testInfo.outputPath('smoke-settings-mobile.png') });
});

test('desabilitar interrompe os desenhos e as configurações são salvas e traduzidas', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await instrumentSmoke(page);
  await page.goto('/');
  await expect(page.locator('.startup-screen')).toHaveCount(0);
  await openSettings(page);
  await page.locator('#smoke-quality').press('Home');
  await page.locator('#smoke-speed').press('End');
  await page.getByRole('switch', { name: 'Fumaça', exact: true }).click();
  await expect(page.locator('canvas.smoke')).toBeHidden();
  const count = await page.evaluate(() => window.smokeMetrics.draws.length);
  await page.waitForTimeout(450);
  expect(await page.evaluate(() => window.smokeMetrics.draws.length)).toBe(count);
  await page.getByRole('switch', { name: 'Linguagem', exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Quality', exact: true })).toHaveValue('25');
  await expect(page.getByRole('switch', { name: 'Smoke', exact: true })).toHaveAttribute('aria-checked', 'false');
  await page.reload();
  await expect(page.locator('.startup-screen')).toHaveCount(0);
  await openSettings(page);
  await expect(page.getByRole('slider', { name: 'Speed', exact: true })).toHaveValue('100');
  await expect(page.getByRole('slider', { name: 'Quality', exact: true })).toHaveValue('25');
  await expect(page.getByRole('switch', { name: 'Smoke', exact: true })).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('canvas.smoke')).toBeHidden();
  await page.getByRole('button', { name: 'Restore defaults', exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Speed', exact: true })).toHaveValue('23');
  await expect(page.locator('canvas.smoke')).toBeVisible();
});

test('configurações salvas inválidas retornam aos padrões', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('forensic-smoke', JSON.stringify({ enabled: 'yes', fps: 0, quality: -1, strength: 101, speed: null })));
  await page.goto('/');
  await expect(page.locator('.startup-screen')).toHaveCount(0);
  await openSettings(page);
  for (const key of ['fps', 'quality', 'strength', 'speed'] as const) await expect(page.locator(`#smoke-${key}`)).toHaveValue(String(defaultSmokeSettings[key]));
  await expect(page.getByRole('switch', { name: 'Fumaça', exact: true })).toHaveAttribute('aria-checked', 'true');
});

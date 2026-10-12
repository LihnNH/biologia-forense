import { expect, test } from '@playwright/test';
import { build } from 'vite';
import type { RolldownOutput } from 'rolldown';
import { fileURLToPath } from 'node:url';
import { createFocalGeometry } from '../src/lib/focalCursor/geometry';
import type { createFocalCursor, FocalCursorOptions } from '../src/lib/focalCursor/controller';

type CursorHost = {
  focalCursorModule: { createFocalCursor: typeof createFocalCursor };
  testCursor: ReturnType<typeof createFocalCursor>;
};

test('a geometria permite raios e lupas diferentes sem depender do navegador', () => {
  const rect = { left: 20, top: 30, right: 220, bottom: 180 };
  for (const cornerShape of ['circle', 'squircle'] as const) {
    const geometry = createFocalGeometry({ cornerShape, cornerRadius: 16, cornerLength: 28 });
    expect(geometry.corner(0, 0, rect, 0, 0)).toEqual([20, 58]);
    const end = geometry.corner(0, 1, rect, 0, 0);
    expect(end[0]).toBeCloseTo(48);
    expect(end[1]).toBeCloseTo(30);
    const translated = geometry.corner(2, .5, rect, 4, -6);
    const original = geometry.corner(2, .5, rect, 0, 0);
    expect(translated[0] - original[0]).toBeCloseTo(4);
    expect(translated[1] - original[1]).toBeCloseTo(-6);
  }
  const small = createFocalGeometry({ lensSize: 24, lensHotspot: 10 });
  const large = createFocalGeometry({ lensSize: 48, lensHotspot: 20 });
  const point = small.lens(1, .5, 0, 0), doubled = large.lens(1, .5, 0, 0);
  expect(doubled[0]).toBeCloseTo(point[0] * 2);
  expect(doubled[1]).toBeCloseTo(point[1] * 2);
});

test('o controlador funciona com alvos de outra tela e limpa os eventos ao ser descartado', async ({ page }) => {
  // Bundle the same production module into an unrelated page, without the app.
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    build: {
      write: false,
      lib: {
        entry: fileURLToPath(new URL('../src/lib/focalCursor/controller.ts', import.meta.url)),
        name: 'focalCursorModule', formats: ['iife'],
      },
    },
  }) as RolldownOutput | RolldownOutput[];
  const bundle = Array.isArray(result) ? result[0] : result;
  const script = bundle.output.find(chunk => chunk.type === 'chunk');
  if (!script || script.type !== 'chunk') throw new Error('Cursor bundle missing.');
  await page.setContent(`<style>
    #other-page { margin: 60px; }
    .targets { display: flex; gap: 60px; width: max-content; }
    button { width: 160px; height: 90px; }
    svg { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  </style>
  <section id="other-page"><div class="targets">
    <button data-focus>Primeiro</button><button data-focus>Segundo</button>
  </div></section>
  <button data-focus id="outside">Fora da tela</button>
  <svg><g data-cursor-pieces><path/><path/><path/><path/></g><path data-cursor-handle/></svg>`);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addScriptTag({ content: script.code });
  const options: FocalCursorOptions = {
    scopeSelector: '#other-page', targetSelector: '[data-focus]', continuitySelector: '.targets',
    targetPadding: 8, followRange: 0, nativeCursor: 'crosshair',
    geometry: { cornerShape: 'circle', cornerRadius: 6, cornerLength: 12 },
  };
  await page.evaluate(options => {
    const host = window as unknown as CursorHost;
    host.testCursor = host.focalCursorModule.createFocalCursor(document.querySelector('svg')!, options);
    host.testCursor.setActive(true);
  }, options);
  const cursor = page.locator('svg'), cards = page.locator('#other-page [data-focus]');
  await cards.nth(0).hover();
  await expect(cursor).toHaveAttribute('data-morph', '1.0000');
  const first = (await cards.nth(0).boundingBox())!, second = (await cards.nth(1).boundingBox())!;
  const cornerX = await page.locator('[data-cursor-pieces]').evaluate(element => (element as SVGGraphicsElement).getBBox().x);
  expect(cornerX).toBeCloseTo(first.x - 8);
  await page.mouse.move((first.x + first.width + second.x) / 2, first.y + first.height / 2);
  await expect(cursor).toHaveAttribute('data-mode', 'target');
  await cards.nth(1).hover();
  await expect(cursor).toHaveAttribute('data-target', '1');
  await page.locator('#outside').hover();
  await expect(cursor).toHaveAttribute('data-morph', '0.0000');
  await page.evaluate(() => (window as unknown as CursorHost).testCursor.dispose());
  await expect(page.locator('body')).not.toHaveClass(/focal-cursor/);
  expect(await page.locator('body').evaluate(element => element.style.getPropertyValue('--focal-cursor-fallback'))).toBe('');
  await cards.nth(0).hover();
  await expect(cursor).not.toHaveClass(/is-visible/);
  await expect(cursor).toHaveAttribute('data-morph', '0.0000');
});

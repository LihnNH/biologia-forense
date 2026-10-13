import { expect, test } from '@playwright/test';
import { openCase } from './helpers/cases';

test.use({ viewport: { width: 1366, height: 768 }, reducedMotion: 'no-preference' });
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => localStorage.setItem('forensic-smoke', JSON.stringify({ enabled: false })));
});

test('a lupa cobre a tela dos suspeitos e os quatro cantos atravessam o espaço entre cards inteiros', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('.startup-screen')).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveClass(/focal-cursor-page/);
  await openCase(page, 'Faca');
  await page.locator('#case-title').hover();
  const cursor = page.locator('.focal-cursor');
  await expect(cursor).toHaveClass(/is-visible/);
  await expect(cursor).toHaveAttribute('data-mode', 'lens');
  await expect.poll(() => cursor.getAttribute('data-morph')).toBe('0.0000');
  expect(await page.locator('#case-title').evaluate(element => getComputedStyle(element).cursor)).toBe('none');
  const cards = page.locator('.suspect-portrait');
  const first = (await cards.nth(0).boundingBox())!, second = (await cards.nth(1).boundingBox())!;
  await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
  await expect(cursor).toHaveAttribute('data-target', '0');
  await expect.poll(async () => Number(await cursor.getAttribute('data-morph'))).toBeGreaterThan(.999);
  await page.screenshot({ path: testInfo.outputPath('suspect-target.png') });
  await page.mouse.move((first.x + first.width + second.x) / 2, first.y + first.height / 2);
  await expect(cursor).toHaveAttribute('data-mode', 'target');
  await expect(cursor).toHaveAttribute('data-target', '0');
  await expect.poll(async () => Number(await cursor.getAttribute('data-morph'))).toBeGreaterThan(.999);
  const changes: number[] = [];
  await page.exposeFunction('recordCursorMorph', (value: number) => changes.push(value));
  await cursor.evaluate(element => new MutationObserver(() => {
    void (window as unknown as { recordCursorMorph: (value: number) => Promise<void> }).recordCursorMorph(Number((element as SVGSVGElement).dataset.morph));
  }).observe(element, { attributes: true, attributeFilter: ['data-morph'] }));
  await page.mouse.move(second.x + second.width / 2, second.y + second.height / 2, { steps: 10 });
  await expect(cursor).toHaveAttribute('data-target', '1');
  await page.waitForTimeout(600);
  expect(changes.length).toBeGreaterThan(5);
  expect(Math.min(...changes)).toBeGreaterThan(.999);
  const targetBox = await page.locator('[data-cursor-pieces]').evaluate(element => (element as SVGGraphicsElement).getBBox().x);
  expect(targetBox).toBeGreaterThan(second.x - 20);
  expect(targetBox).toBeLessThan(second.x);
  await page.screenshot({ path: testInfo.outputPath('suspect-target-next.png') });
  await page.locator('#open-pick').hover();
  await expect(cursor).toHaveAttribute('data-mode', 'lens');
  await expect.poll(() => cursor.getAttribute('data-morph')).toBe('0.0000');
});

test('o cursor não bloqueia depoimentos, ajuda, configurações nem a marcação do suspeito', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.startup-screen')).toHaveCount(0);
  await openCase(page, 'Faca');
  await page.getByRole('button', { name: 'Ver informações de Rafael Oliveira', exact: true }).click();
  await expect(page.locator('.portrait-modal')).toHaveAttribute('data-phase', 'open');
  await expect(page.locator('.focal-cursor')).not.toHaveClass(/is-visible/);
  await expect(page.locator('body')).not.toHaveClass(/focal-cursor-page/);
  await page.keyboard.press('Escape');
  await expect(page.locator('.portrait-modal')).toHaveCount(0);
  await page.keyboard.press('h');
  await expect(page.locator('#page-help-modal')).toBeVisible();
  await expect(page.locator('.focal-cursor')).not.toHaveClass(/is-visible/);
  await page.keyboard.press('Escape');
  await page.keyboard.press('c');
  await expect(page.locator('#settings-modal')).toBeVisible();
  await expect(page.locator('.focal-cursor')).not.toHaveClass(/is-visible/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#settings-modal')).toHaveCount(0);
  await page.locator('#open-pick').click();
  await page.getByRole('button', { name: 'Marcar Rafael Oliveira como suspeito', exact: true }).click();
  await expect(page.locator('.suspect-portrait.is-guess')).toHaveCount(1);
  await page.locator('#open-guess').click();
  await expect(page.locator('#guess-view')).toBeVisible();
  await expect(page.locator('.focal-cursor')).not.toHaveClass(/is-visible/);
  await expect(page.locator('body')).not.toHaveClass(/focal-cursor/);
});

test('movimento reduzido preserva a lupa e os alvos sem animação de transição', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.startup-screen')).toHaveCount(0);
  await openCase(page, 'Faca');
  await page.locator('.suspect-portrait').nth(0).hover();
  await expect(page.locator('.focal-cursor')).toHaveAttribute('data-morph', '1.0000');
  await page.locator('#case-title').hover();
  await expect(page.locator('.focal-cursor')).toHaveAttribute('data-morph', '0.0000');
  await page.locator('#case-view .case-back').click();
  await expect(page.locator('#home-view')).toBeVisible();
  await expect(page.locator('body')).not.toHaveClass(/focal-cursor/);
});

test('o contorno acompanha a inclinação e as mudanças do card de palpite com o mouse parado', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('.startup-screen')).toHaveCount(0);
  await openCase(page, 'Faca');
  await page.locator('#open-pick').click();
  const card = page.locator('.suspect-portrait').first();
  await expect.poll(() => card.evaluate(element => element.getAnimations().filter(animation => animation.playState === 'running'
    && animation.effect instanceof KeyframeEffect && animation.effect.getKeyframes().some(frame => 'transform' in frame)).length)).toBe(0);
  await card.evaluate(element => (element as HTMLElement).style.setProperty('--portrait-tilt', '3deg'));
  await card.hover();
  await expect(page.locator('.focal-cursor')).toHaveAttribute('data-morph', '1.0000');
  const alignment = () => card.evaluate(element => {
    const path = document.querySelector<SVGPathElement>('[data-cursor-pieces] path')!;
    const length = path.getTotalLength();
    const start = path.getPointAtLength(length - 4), end = path.getPointAtLength(length);
    const cursorAngle = Math.atan2(end.y - start.y, end.x - start.x);
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    const cardAngle = Math.atan2(matrix.b, matrix.a);
    const shape = document.querySelector<SVGGraphicsElement>('[data-cursor-pieces]')!.getBBox();
    const box = element.getBoundingClientRect();
    return { cursorAngle, cardAngle,
      centerError: Math.hypot(shape.x + shape.width / 2 - box.left - box.width / 2,
        shape.y + shape.height / 2 - box.top - box.height / 2) };
  });
  await expect.poll(async () => Math.abs((await alignment()).cursorAngle * 180 / Math.PI - 3)).toBeLessThan(.1);
  await expect.poll(async () => Math.abs((await alignment()).cursorAngle - (await alignment()).cardAngle)).toBeLessThan(.002);
  // Change the live CSS transition after the cursor has settled; no pointermove wakes it.
  await card.evaluate(element => (element as HTMLElement).style.setProperty('--portrait-tilt', '-6deg'));
  await expect.poll(async () => Math.abs((await alignment()).cursorAngle * 180 / Math.PI + 6)).toBeLessThan(.1);
  await expect.poll(async () => Math.abs((await alignment()).cursorAngle - (await alignment()).cardAngle)).toBeLessThan(.002);
  expect((await alignment()).centerError).toBeLessThan(3);
  await page.screenshot({ path: testInfo.outputPath('picking-rotated-cursor.png') });
  await page.getByRole('button', { name: 'Marcar Rafael Oliveira como suspeito', exact: true }).click();
  await expect(page.locator('.suspect-gallery')).not.toHaveClass(/is-picking/);
  await expect.poll(async () => Math.abs((await alignment()).cursorAngle)).toBeLessThan(.002);
  await expect(page.locator('.suspect-portrait.is-guess')).toHaveCount(1);
});

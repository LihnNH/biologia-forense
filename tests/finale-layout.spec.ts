import { expect, test } from '@playwright/test';
import { CASES, CASE_ORDER, CASE_RESULTS } from '../src/data/cases';

const screens = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 1280, height: 600 },
];

for (const id of CASE_ORDER) {
  test(`o finale de ${id} cabe em monitores e notebooks com o aviso de palpite`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize(screens[0]);
    await page.goto('/');
    await page.locator(`[data-case="${id}"]`).click();
    await page.locator('#open-pick').click();
    const wrongSuspect = CASES[id].suspects.find(suspect => suspect.name !== CASE_RESULTS[id].culprit)!;
    await page.getByRole('button', { name: `Marcar ${wrongSuspect.name} como suspeito`, exact: true }).click();
    await page.locator('#open-guess').click();
    for (const [index, character] of Array.from(CASE_RESULTS[id].code).entries()) await page.locator('.code-input').nth(index).fill(character);
    await expect(page.locator('.finale-screen')).toHaveAttribute('data-phase', 'complete');
    await expect(page.locator('.finale-content')).toHaveCSS('opacity', '1');
    await expect(page.locator('.finale-status')).toHaveCSS('opacity', '1');

    for (const viewport of screens) {
      await page.setViewportSize(viewport);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight), {
        message: `${id} não deve rolar em ${viewport.width}×${viewport.height}`,
      }).toBeLessThanOrEqual(viewport.height + 1);
      const bounds = await page.locator('#result-title, #result-guess-notice, #result-explanation, #done-home').evaluateAll(elements => elements.map(element => {
        const rect = element.getBoundingClientRect();
        return { id: element.id, top: rect.top, bottom: rect.bottom };
      }));
      for (const element of bounds) {
        expect(element.top, `${element.id} começa dentro da tela`).toBeGreaterThanOrEqual(0);
        expect(element.bottom, `${element.id} termina dentro da tela`).toBeLessThanOrEqual(viewport.height);
      }
      await page.mouse.wheel(0, 600);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
      await page.screenshot({ path: testInfo.outputPath(`finale-${viewport.width}x${viewport.height}.png`) });
    }
  });
}

test('a solução em inglês cabe no notebook sem o aviso de palpite', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('forensic-language', 'en'));
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.goto('/');
  await page.locator('[data-case="Veneno"]').click();
  await page.locator('#open-pick').click();
  await page.getByRole('button', { name: 'Select Gustavo Almeida as your suspect', exact: true }).click();
  await page.locator('#open-guess').click();
  for (const [index, character] of Array.from(CASE_RESULTS.Veneno.code).entries()) await page.locator('.code-input').nth(index).fill(character);
  await expect(page.locator('.finale-screen')).toHaveAttribute('data-phase', 'complete');
  await expect(page.locator('#result-guess-notice')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(601);
  expect(await page.locator('#done-home').evaluate(element => element.getBoundingClientRect().bottom)).toBeLessThanOrEqual(600);
});

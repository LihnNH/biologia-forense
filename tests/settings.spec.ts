import { expect, test, type Page } from '@playwright/test';
import { CASES, CASE_ORDER, CASE_RESULTS } from '../src/data/cases';
import { caseLabelsEn, caseResultsEn, casesEn, hotspotDetailsEn } from '../src/i18n/content.en';
import { hotspots } from '../src/data/dna';

async function openSettings(page: Page) {
  await page.keyboard.press('c');
  await expect(page.getByRole('dialog', { name: /Configurações|Settings/ })).toBeVisible();
  await expect.poll(() => page.locator('#settings-modal').evaluate(element => getComputedStyle(element).opacity)).toBe('1');
}

async function closeSettings(page: Page) {
  await page.keyboard.press('c');
  await expect(page.locator('#settings-modal')).toHaveCount(0);
}

test('o seletor desliza, traduz, mantém o foco e salva a linguagem', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('.startup-screen')).toHaveCount(0);
  await openSettings(page);
  const toggle = page.getByRole('switch', { name: /Linguagem|Language/ });
  await expect(toggle).toHaveCount(1);
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await expect(toggle).toBeFocused();
  expect(await page.locator('#settings-modal .modal-panel').evaluate(element => getComputedStyle(element).outlineStyle)).toBe('none');
  const thumb = page.locator('.language-switch-thumb');
  const left = await thumb.boundingBox();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('#settings-title')).toHaveText('Settings');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page).toHaveTitle('Forensic Biology — DNA Verifier');
  await expect.poll(() => thumb.evaluate(element => element.getAnimations().length)).toBe(0);
  expect((await thumb.boundingBox())!.x).toBeGreaterThan(left!.x + 100);
  await page.screenshot({ path: testInfo.outputPath('settings-english.png') });
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('.settings-debug-link')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await closeSettings(page);
  await expect(page.getByRole('heading', { name: 'Forensic Biology', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Forensic Biology', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await openSettings(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: testInfo.outputPath('settings-mobile.png') });
});

test('trocar a linguagem preserva o suspeito, o código e o depoimento aberto', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-case="Faca"]').click();
  await page.getByRole('button', { name: 'Ver informações de Rafael Oliveira', exact: true }).click();
  await expect(page.locator('.portrait-modal')).toHaveAttribute('data-phase', 'open');
  await openSettings(page);
  await page.getByRole('switch', { name: /Linguagem|Language/ }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#settings-modal')).toHaveCount(0);
  await expect(page.locator('.portrait-modal')).toBeVisible();
  await expect(page.locator('.suspect-text')).toContainText('Time at the restaurant:');
  await expect(page.locator('.suspect-text')).toContainText('11 years');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.locator('.portrait-modal')).toHaveCount(0);
  await page.locator('#open-pick').click();
  await page.getByRole('button', { name: 'Select Rafael Oliveira as your suspect', exact: true }).click();
  await page.locator('#open-guess').click();
  const inputs = page.locator('.code-input');
  await inputs.nth(0).fill('T');
  await inputs.nth(1).fill('A');
  await page.locator('#back-to-case').focus();
  await openSettings(page);
  await page.getByRole('switch', { name: /Linguagem|Language/ }).click();
  await closeSettings(page);
  await expect(page.locator('#guess-selected-name')).toHaveText('Rafael Oliveira');
  await expect(inputs.nth(0)).toHaveValue('T');
  await expect(inputs.nth(1)).toHaveValue('A');
  await inputs.nth(2).press('c');
  await expect(inputs.nth(2)).toHaveValue('C');
  await expect(page.locator('#settings-modal')).toHaveCount(0);
  await inputs.nth(2).fill('G');
  await inputs.nth(3).fill('C');
  await expect(page.locator('#result-title')).toHaveText('Lâmina Sombria: caso solucionado');
});

for (const id of CASE_ORDER) {
  test(`resolve ${id} em inglês sem alterar a resposta`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('forensic-language', 'en'));
    await page.goto('/');
    await page.locator(`[data-case="${id}"]`).click();
    await expect(page.locator('#case-title')).toHaveText(caseLabelsEn[id]);
    await page.locator('#open-pick').click();
    await page.getByRole('button', { name: `Select ${CASE_RESULTS[id].culprit} as your suspect`, exact: true }).click();
    await page.locator('#open-guess').click();
    await expect(page.getByLabel('First code character')).toBeFocused();
    for (let index = 0; index < 4; index++) await page.locator('.code-input').nth(index).fill(CASE_RESULTS[id].code[index]);
    await expect(page.locator('#result-title')).toHaveText(`${caseLabelsEn[id]}: case solved`);
    await expect(page.locator('#result-explanation')).toContainText('both parts of the investigation');
    await expect(page.locator('#culprit-name')).toHaveText(CASE_RESULTS[id].culprit);
  });
}

test('traduz o erro e o DNA, incluindo o ponto selecionado e a licença', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('forensic-language', 'en'));
  await page.goto('/');
  await page.locator('#open-dna-info-home').click();
  await page.locator('#dna-title-toggle').click();
  await expect(page.locator('#dna-title-reveal')).toContainText('genetic information');
  await expect(page.locator('#dna-3d-status')).toHaveClass(/hidden/);
  await page.keyboard.press('2');
  await expect(page.locator('#dna-callout-title')).toHaveText('Adenine');
  await openSettings(page);
  await page.getByRole('switch', { name: /Linguagem|Language/ }).click();
  await closeSettings(page);
  await expect(page.locator('#dna-callout-title')).toHaveText('Adenina');
  await page.keyboard.press('l');
  await expect(page.locator('#dna-license-card')).toHaveClass(/is-open/);
  await expect(page.locator('.dna-license-title')).toHaveText('Licença');
  await page.locator('#close-dna-info').click();
  await page.locator('[data-case="Faca"]').click();
  await page.locator('#open-pick').click();
  await page.getByRole('button', { name: 'Marcar Rafael Oliveira como suspeito', exact: true }).click();
  await page.locator('#open-guess').click();
  for (let index = 0; index < 4; index++) await page.locator('.code-input').nth(index).fill('A');
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await openSettings(page);
  await page.getByRole('switch', { name: /Linguagem|Language/ }).click();
  await closeSettings(page);
  await expect(page.locator('#guess-error-title')).toHaveText('Incorrect guess');
  await expect(page.locator('#guess-error-copy')).toContainText('does not match the evidence');
});

test('traduz o modo 2D mesmo após a falha de WebGL', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof original>) {
      if (String(args[0]).startsWith('webgl')) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto('/');
  await page.locator('#open-dna-info-home').click();
  await expect(page.locator('#dna-fallback-message')).toContainText('não está disponível');
  await openSettings(page);
  await page.getByRole('switch', { name: /Linguagem|Language/ }).click();
  await closeSettings(page);
  await expect(page.locator('#dna-fallback-message')).toContainText('is not available');
  await expect(page.locator('#dna-3d-status')).toHaveText('Compatible 2D mode active');
});

test('as traduções mantêm todos os suspeitos, idades, códigos e pontos do DNA', () => {
  for (const id of CASE_ORDER) {
    expect(casesEn[id].suspects.map(({ name, age }) => ({ name, age }))).toEqual(CASES[id].suspects.map(({ name, age }) => ({ name, age })));
    for (const suspect of casesEn[id].suspects) {
      expect(suspect.statement).toContain(`**Age:** ${suspect.age} years`);
      expect(suspect.role).toBeTruthy();
    }
    expect(caseResultsEn[id].code).toBe(CASE_RESULTS[id].code);
    expect(caseResultsEn[id].culprit).toBe(CASE_RESULTS[id].culprit);
    expect(caseResultsEn[id].explanation).toContain(`**${CASE_RESULTS[id].culprit}**`);
  }
  expect(hotspotDetailsEn).toHaveLength(hotspots.length);
});
